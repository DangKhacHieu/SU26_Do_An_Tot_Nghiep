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
            if (isManager && !callerMarketId.HasValue)
            {
                return new List<ContentDto>();
            }

            var results = await _notificationRepository.GetNotificationsAsync(type, targetRole, ct);

            if (callerMarketId.HasValue)
            {
                results = results.Where(n => n.CreatedByUserId == currentUserId.Value || (n.CreatedByUser != null && n.CreatedByUser.MarketId == callerMarketId.Value));
            }

            return _mapper.Map<IEnumerable<ContentDto>>(results);
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
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            if (callerMarketId.HasValue && content.CreatedByUser?.MarketId != callerMarketId.Value && content.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            return _mapper.Map<ContentDto>(content);
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

            // Fallback Creator User ID
            int creatorId = request.CreatedByUserId ?? 0;
            if (creatorId <= 0)
            {
                var managerUser = await _userRepository.GetFirstManagerOrAdminAsync(ct);
                creatorId = managerUser?.UserId ?? 1;
            }

            Notification lastNotification = null!;

            if (request.TargetUserIds != null && request.TargetUserIds.Count > 0)
            {
                foreach (var userId in request.TargetUserIds)
                {
                    var notification = new Notification
                    {
                        Title = request.Title,
                        Content = request.Content,
                        NotiType = request.NotiType ?? "Announcement",
                        TargetRole = request.TargetRole, // Retain target role for individual recipients
                        TargetUserId = userId,
                        CreatedByUserId = creatorId,
                        IsRead = false,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _notificationRepository.AddAsync(notification, ct);
                    lastNotification = notification;
                }
                await _notificationRepository.SaveChangesAsync(ct);
            }
            else
            {
                var notification = new Notification
                {
                    Title = request.Title,
                    Content = request.Content,
                    NotiType = request.NotiType ?? "Article",
                    TargetRole = request.TargetRole,
                    TargetUserId = request.TargetUserId,
                    CreatedByUserId = creatorId,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                };
                await _notificationRepository.AddAsync(notification, ct);
                await _notificationRepository.SaveChangesAsync(ct);
                lastNotification = notification;
            }

            // Populate TargetUser for mapping
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
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            if (callerMarketId.HasValue && notification.CreatedByUser?.MarketId != callerMarketId.Value && notification.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            notification.Title = request.Title;
            notification.Content = request.Content;
            notification.NotiType = request.NotiType ?? "Article";
            notification.TargetRole = request.TargetRole;
            notification.TargetUserId = request.TargetUserId;

            _notificationRepository.Update(notification);
            await _notificationRepository.SaveChangesAsync(ct);

            // Populate TargetUser for mapping
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
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            if (callerMarketId.HasValue && notification.CreatedByUserId != currentUserId.Value)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            _notificationRepository.Delete(notification);
            var result = await _notificationRepository.SaveChangesAsync(ct);
            return result > 0;
        }
    }
}
