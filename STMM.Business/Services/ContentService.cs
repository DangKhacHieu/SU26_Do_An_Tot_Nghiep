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

        public async Task<IEnumerable<ContentDto>> GetContentsAsync(string? type, string? targetRole, CancellationToken ct = default)
        {
            IQueryable<Notification> query = _notificationRepository.Query()
                .Include(n => n.TargetUser);

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(n => n.NotiType == type);
            }

            if (!string.IsNullOrEmpty(targetRole))
            {
                query = query.Where(n => n.TargetRole == targetRole);
            }

            var results = await query.OrderByDescending(n => n.CreatedAt).ToListAsync(ct);
            return _mapper.Map<IEnumerable<ContentDto>>(results);
        }

        public async Task<ContentDto> GetContentByIdAsync(int id, CancellationToken ct = default)
        {
            var content = await _notificationRepository.Query()
                .Include(n => n.TargetUser)
                .FirstOrDefaultAsync(n => n.NotiId == id, ct);

            if (content == null)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            return _mapper.Map<ContentDto>(content);
        }

        public async Task<ContentDto> CreateContentAsync(CreateContentRequest request, CancellationToken ct = default)
        {
            var valResult = await _createValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Fallback Creator User ID
            int creatorId = request.CreatedByUserId ?? 0;
            if (creatorId <= 0)
            {
                var managerUser = await _userRepository.Query()
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Role.Name.ToLower() == "manager" || u.Role.Name.ToLower() == "admin", ct);
                
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

        public async Task<ContentDto> UpdateContentAsync(int id, UpdateContentRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var notification = await _notificationRepository.Query()
                .Include(n => n.TargetUser)
                .FirstOrDefaultAsync(n => n.NotiId == id, ct);

            if (notification == null)
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

        public async Task<bool> DeleteContentAsync(int id, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.Query()
                .FirstOrDefaultAsync(n => n.NotiId == id, ct);

            if (notification == null)
            {
                throw new NotFoundException($"Không tìm thấy thông báo có ID {id}.");
            }

            _notificationRepository.Delete(notification);
            var result = await _notificationRepository.SaveChangesAsync(ct);
            return result > 0;
        }
    }
}
