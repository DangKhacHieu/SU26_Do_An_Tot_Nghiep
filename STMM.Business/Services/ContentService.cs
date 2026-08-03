using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Content;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class ContentService : IContentService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateContentRequest> _createValidator;
        private readonly IValidator<UpdateContentRequest> _updateValidator;

        public ContentService(
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IValidator<CreateContentRequest> createValidator,
            IValidator<UpdateContentRequest> updateValidator)
        {
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        private async Task<(User? caller, int? marketId, bool isManager)> GetCallerInfoAsync(int? currentUserId, CancellationToken ct)
        {
            if (!currentUserId.HasValue) return (null, null, false);
            var user = await _userRepository.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
            if (user == null) return (null, null, false);
            bool isManager = string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase);
            return (user, user.MarketId, isManager);
        }

        public async Task<IEnumerable<ContentDto>> GetContentsAsync(string? type, string? targetRole, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            System.Console.WriteLine($"[DEBUG GETCONTENTS] currentUserId: {currentUserId}, callerMarketId: {callerMarketId}, isManager: {isManager}");
            if (isManager && !callerMarketId.HasValue)
            {
                System.Console.WriteLine($"[DEBUG GETCONTENTS] isManager is true but callerMarketId is null! Returning empty list.");
                return new List<ContentDto>();
            }

            var results = await _notificationRepository.GetNotificationsAsync(type, targetRole, ct);
            System.Console.WriteLine($"[DEBUG GETCONTENTS] Fetched results count from DB: {results.Count()}");

            if (callerMarketId.HasValue)
            {
                results = results.Where(n => n.CreatedByUserId == currentUserId.Value || (n.CreatedByUser != null && n.CreatedByUser.MarketId == callerMarketId.Value));
            }
            System.Console.WriteLine($"[DEBUG GETCONTENTS] After MarketId filtering: {results.Count()}");

            // Chỉ lấy loại Article (Tin tức) và Announcement (Thông báo)
            results = results.Where(n => n.NotiType == "Article" || n.NotiType == "Announcement");
            System.Console.WriteLine($"[DEBUG GETCONTENTS] After NotiType filtering: {results.Count()}");

            // Nhóm các bản ghi trùng lặp theo tiêu đề, nội dung, loại, người tạo và thời gian tạo làm tròn đến phút
            var groupedResults = results
                .GroupBy(n => new { 
                    n.Title, 
                    n.Content, 
                    n.NotiType, 
                    n.CreatedByUserId,
                    RoundedTime = n.CreatedAt.HasValue 
                        ? new DateTime(n.CreatedAt.Value.Year, n.CreatedAt.Value.Month, n.CreatedAt.Value.Day, n.CreatedAt.Value.Hour, n.CreatedAt.Value.Minute, 0)
                        : DateTime.MinValue
                })
                .Select(g => {
                    var first = g.First();
                    if (g.Count() > 1)
                    {
                        var roles = g.Where(x => x.TargetUser != null && x.TargetUser.Role != null)
                                     .Select(x => x.TargetUser.Role.Name)
                                     .Distinct()
                                     .ToList();
                        if (roles.Count == 1)
                        {
                            first.TargetRole = roles[0];
                            first.TargetUserId = null;
                        }
                    }
                    return first;
                })
                .ToList();

            return _mapper.Map<IEnumerable<ContentDto>>(groupedResults);
        }

        public async Task<ContentDto> GetContentByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            var content = await _notificationRepository.GetNotificationWithUserByIdAsync(id, ct);

            if (content == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            if (callerMarketId.HasValue && content.CreatedByUser?.MarketId != callerMarketId.Value && content.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            var dto = _mapper.Map<ContentDto>(content);

            // Tìm toàn bộ nhóm bản ghi để thiết lập TargetRole động
            var groupNotifications = await _notificationRepository.FindAsync(n =>
                n.CreatedByUserId == content.CreatedByUserId &&
                n.Title == content.Title &&
                n.Content == content.Content &&
                n.NotiType == content.NotiType &&
                n.CreatedAt.HasValue && content.CreatedAt.HasValue &&
                Math.Abs((n.CreatedAt.Value - content.CreatedAt.Value).TotalSeconds) <= 10,
                ct);

            if (groupNotifications.Count() > 1)
            {
                var roles = groupNotifications
                    .Where(x => x.TargetUser != null && x.TargetUser.Role != null)
                    .Select(x => x.TargetUser.Role.Name)
                    .Distinct()
                    .ToList();
                if (roles.Count == 1)
                {
                    dto.TargetRole = roles[0];
                    dto.TargetUserId = null;
                }
            }

            return dto;
        }

        public async Task<ContentDto> CreateContentAsync(CreateContentRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                throw new BadRequestException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt. Bạn chỉ có thể tạo thông báo mới sau khi chợ của bạn được phê duyệt.");
            }
            var valResult = await _createValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            int creatorId = request.CreatedByUserId ?? currentUserId ?? 0;
            if (creatorId <= 0)
            {
                var managerUser = await _userRepository.GetFirstManagerOrAdminAsync(ct);
                creatorId = managerUser?.UserId ?? 1;
            }

            var targetUserIds = request.TargetUserIds?
                .Where(userId => userId > 0)
                .Distinct()
                .ToList() ?? new List<int>();

            if (request.TargetUserId is > 0)
            {
                targetUserIds.Add(request.TargetUserId.Value);
            }

            if (targetUserIds.Count == 0 && !string.IsNullOrWhiteSpace(request.TargetRole))
            {
                var recipients = await _userRepository.GetActiveUsersByRoleAsync(request.TargetRole, ct);
                if (callerMarketId.HasValue && !request.TargetRole.Equals("Public", StringComparison.OrdinalIgnoreCase))
                {
                    recipients = recipients.Where(u => u.MarketId == callerMarketId.Value).ToList();
                }
                targetUserIds.AddRange(recipients.Select(user => user.UserId));
            }

            targetUserIds = targetUserIds.Distinct().ToList();
            if (targetUserIds.Count == 0)
            {
                throw new BadRequestException("At least one active recipient is required.");
            }

            Notification lastNotification = null!;
            var now = DateTime.UtcNow;
            foreach (var userId in targetUserIds)
            {
                var notification = new Notification
                {
                    Title = request.Title,
                    Content = request.Content,
                    NotiType = request.NotiType ?? "Announcement",
                    TargetRole = null,
                    TargetUserId = userId,
                    CreatedByUserId = creatorId,
                    IsRead = false,
                    CreatedAt = now
                };
                await _notificationRepository.AddAsync(notification, ct);
                lastNotification = notification;
            }
            await _notificationRepository.SaveChangesAsync(ct);

            if (lastNotification.TargetUserId.HasValue)
            {
                lastNotification.TargetUser = await _userRepository.GetByIdAsync(lastNotification.TargetUserId.Value, ct);
            }

            return _mapper.Map<ContentDto>(lastNotification);
        }

        public async Task<ContentDto> UpdateContentAsync(int id, UpdateContentRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                throw new BadRequestException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
            }

            var valResult = await _updateValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var notification = await _notificationRepository.GetNotificationWithUserByIdAsync(id, ct);

            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            if (callerMarketId.HasValue && notification.CreatedByUser?.MarketId != callerMarketId.Value && notification.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            // Tìm toàn bộ nhóm bản ghi liên quan để cập nhật đồng loạt
            var groupNotifications = await _notificationRepository.FindAsync(n =>
                n.CreatedByUserId == notification.CreatedByUserId &&
                n.Title == notification.Title &&
                n.Content == notification.Content &&
                n.NotiType == notification.NotiType &&
                n.CreatedAt.HasValue && notification.CreatedAt.HasValue &&
                Math.Abs((n.CreatedAt.Value - notification.CreatedAt.Value).TotalSeconds) <= 10,
                ct);

            foreach (var noti in groupNotifications)
            {
                noti.Title = request.Title;
                noti.Content = request.Content;
                noti.NotiType = request.NotiType ?? "Article";
                _notificationRepository.Update(noti);
            }

            await _notificationRepository.SaveChangesAsync(ct);

            if (notification.TargetUserId.HasValue)
            {
                notification.TargetUser = await _userRepository.GetByIdAsync(notification.TargetUserId.Value, ct);
            }

            return _mapper.Map<ContentDto>(notification);
        }

        public async Task<bool> DeleteContentAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                throw new BadRequestException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
            }

            var notification = await _notificationRepository.GetByIdAsync(id, ct);

            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {id} was not found.");
            }

            if (callerMarketId.HasValue && notification.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            // Tìm toàn bộ nhóm bản ghi liên quan để xóa đồng loạt
            var groupNotifications = await _notificationRepository.FindAsync(n =>
                n.CreatedByUserId == notification.CreatedByUserId &&
                n.Title == notification.Title &&
                n.Content == notification.Content &&
                n.NotiType == notification.NotiType &&
                n.CreatedAt.HasValue && notification.CreatedAt.HasValue &&
                Math.Abs((n.CreatedAt.Value - notification.CreatedAt.Value).TotalSeconds) <= 10,
                ct);

            foreach (var noti in groupNotifications)
            {
                _notificationRepository.Delete(noti);
            }

            var result = await _notificationRepository.SaveChangesAsync(ct);
            return result > 0;
        }
    }
}
