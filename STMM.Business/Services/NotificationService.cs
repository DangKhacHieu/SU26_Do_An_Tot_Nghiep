using AutoMapper;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;
        private readonly IMapper _mapper;

        public NotificationService(INotificationRepository notificationRepository, IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task CreateAsync(CreateNotificationRequest request, CancellationToken ct = default)
        {
            // TargetUserId XOR TargetRole - not both
            var hasUser = request.TargetUserId.HasValue;
            var hasRole = !string.IsNullOrWhiteSpace(request.TargetRole);

            if (hasUser && hasRole)
            {
                throw new BadRequestException(
                    "Notification cannot be sent to both a specific user and a role simultaneously. Choose one of them.");
            }

            if (!hasUser && !hasRole)
            {
                throw new BadRequestException(
                    "Notification must have at least TargetUserId or TargetRole.");
            }

            var notification = new Notification
            {
                Title = request.Title,
                Content = request.Content,
                NotiType = request.NotiType,
                CreatedByUserId = request.CreatedByUserId,
                TargetUserId = request.TargetUserId,
                TargetRole = request.TargetRole,
                IsRead = false,
                CreatedAt = DateTime.UtcNow
            };

            await _notificationRepository.AddAsync(notification, ct);
            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<NotificationDto>> GetNotificationsForUserAsync(int userId, string? roleName, CancellationToken ct = default)
        {
            var targetRoleLower = roleName?.Trim().ToLower();
            var limitDate = DateTime.UtcNow.AddDays(-60);

            var notifications = await _notificationRepository.FindAsync(n =>
                (n.CreatedAt >= limitDate) &&
                ((n.TargetUserId == userId) ||
                (!string.IsNullOrWhiteSpace(n.TargetRole) && n.TargetRole.ToLower() == targetRoleLower) ||
                (!string.IsNullOrWhiteSpace(n.TargetRole) && n.TargetRole.ToLower() == "public")),
                ct);

            var sortedNotifications = notifications.OrderByDescending(n => n.CreatedAt ?? DateTime.MinValue);

            return _mapper.Map<IEnumerable<NotificationDto>>(sortedNotifications);
        }

        /// <inheritdoc />
        public async Task MarkAsReadAsync(int notiId, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(notiId, ct);
            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {notiId} not found.");
            }

            notification.IsRead = true;
            _notificationRepository.Update(notification);
            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task MarkAllAsReadAsync(int userId, string? roleName, CancellationToken ct = default)
        {
            var targetRoleLower = roleName?.Trim().ToLower();
            var limitDate = DateTime.UtcNow.AddDays(-60);

            var notifications = await _notificationRepository.FindAsync(n =>
                (n.IsRead == false || n.IsRead == null) &&
                (n.CreatedAt >= limitDate) &&
                ((n.TargetUserId == userId) ||
                (!string.IsNullOrWhiteSpace(n.TargetRole) && n.TargetRole.ToLower() == targetRoleLower) ||
                (!string.IsNullOrWhiteSpace(n.TargetRole) && n.TargetRole.ToLower() == "public")),
                ct);

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                _notificationRepository.Update(notification);
            }

            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task DeleteAsync(int notiId, CancellationToken ct = default)
        {
            var notification = await _notificationRepository.GetByIdAsync(notiId, ct);
            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {notiId} not found.");
            }

            _notificationRepository.Delete(notification);
            await _notificationRepository.SaveChangesAsync(ct);
        }
    }
}
