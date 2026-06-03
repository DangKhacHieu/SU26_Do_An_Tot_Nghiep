using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class NotificationService : INotificationService
    {
        private readonly INotificationRepository _notificationRepository;

        public NotificationService(INotificationRepository notificationRepository)
        {
            _notificationRepository = notificationRepository;
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
    }
}
