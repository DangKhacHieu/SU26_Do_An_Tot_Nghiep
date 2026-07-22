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
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public NotificationService(
            INotificationRepository notificationRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _notificationRepository = notificationRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task CreateAsync(CreateNotificationRequest request, CancellationToken ct = default)
        {
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

            var targetUserIds = new List<int>();
            if (request.TargetUserId.HasValue)
            {
                targetUserIds.Add(request.TargetUserId.Value);
            }
            else
            {
                var recipients = await _userRepository.GetActiveUsersByRoleAsync(request.TargetRole, ct);
                targetUserIds.AddRange(recipients.Select(user => user.UserId));
            }

            if (targetUserIds.Count == 0)
            {
                throw new BadRequestException("No active notification recipient was found.");
            }

            foreach (var targetUserId in targetUserIds.Distinct())
            {
                await _notificationRepository.AddAsync(new Notification
                {
                    Title = request.Title,
                    Content = request.Content,
                    NotiType = request.NotiType,
                    CreatedByUserId = request.CreatedByUserId,
                    TargetUserId = targetUserId,
                    TargetRole = null,
                    IsRead = false,
                    CreatedAt = DateTime.UtcNow
                }, ct);
            }

            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task<IEnumerable<NotificationDto>> GetNotificationsForUserAsync(int userId, CancellationToken ct = default)
        {
            if (userId <= 0)
            {
                throw new BadRequestException("ID người dùng không hợp lệ.");
            }

            var limitDate = DateTime.UtcNow.AddDays(-60);

            var notifications = await _notificationRepository.FindAsync(n =>
                n.CreatedAt >= limitDate && n.TargetUserId == userId,
                ct);

            var sortedNotifications = notifications.OrderByDescending(n => n.CreatedAt ?? DateTime.MinValue);

            return _mapper.Map<IEnumerable<NotificationDto>>(sortedNotifications);
        }

        /// <inheritdoc />
        public async Task MarkAsReadAsync(int notiId, int userId, CancellationToken ct = default)
        {
            var notification = (await _notificationRepository.FindAsync(
                n => n.NotiId == notiId && n.TargetUserId == userId,
                ct)).FirstOrDefault();
            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {notiId} not found.");
            }

            notification.IsRead = true;
            _notificationRepository.Update(notification);
            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task MarkAllAsReadAsync(int userId, CancellationToken ct = default)
        {
            if (userId <= 0)
            {
                throw new BadRequestException("ID người dùng không hợp lệ.");
            }

            var limitDate = DateTime.UtcNow.AddDays(-60);

            var notifications = await _notificationRepository.FindAsync(n =>
                (n.IsRead == false || n.IsRead == null) &&
                (n.CreatedAt >= limitDate) &&
                n.TargetUserId == userId,
                ct);

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
                _notificationRepository.Update(notification);
            }

            await _notificationRepository.SaveChangesAsync(ct);
        }

        /// <inheritdoc />
        public async Task DeleteAsync(int notiId, int userId, CancellationToken ct = default)
        {
            if (notiId <= 0 || userId <= 0)
            {
                throw new BadRequestException("Dữ liệu đầu vào không hợp lệ.");
            }

            var notification = (await _notificationRepository.FindAsync(
                n => n.NotiId == notiId && n.TargetUserId == userId,
                ct)).FirstOrDefault();
            if (notification == null)
            {
                throw new NotFoundException($"Notification with ID {notiId} not found.");
            }

            _notificationRepository.Delete(notification);
            await _notificationRepository.SaveChangesAsync(ct);
        }
    }
}
