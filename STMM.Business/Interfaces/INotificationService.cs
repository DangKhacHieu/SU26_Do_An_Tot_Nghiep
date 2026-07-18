using STMM.Business.DTOs.Notification;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface INotificationService
    {
        /// <summary>
        /// Create a new notification in the system.
        /// TargetUserId XOR TargetRole (not both).
        /// </summary>
        Task CreateAsync(CreateNotificationRequest request, CancellationToken ct = default);

        /// <summary>
        /// Get notifications for a user by their userId and roleName.
        /// </summary>
        Task<IEnumerable<NotificationDto>> GetNotificationsForUserAsync(int userId, string? roleName, CancellationToken ct = default);

        /// <summary>
        /// Mark a notification as read.
        /// </summary>
        Task MarkAsReadAsync(int notiId, CancellationToken ct = default);

        /// <summary>
        /// Mark all notifications as read for a user.
        /// </summary>
        Task MarkAllAsReadAsync(int userId, string? roleName, CancellationToken ct = default);

        /// <summary>
        /// Delete a notification.
        /// </summary>
        Task DeleteAsync(int notiId, int userId, string? roleName, CancellationToken ct = default);
    }
}
