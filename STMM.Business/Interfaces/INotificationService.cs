using STMM.Business.DTOs.Notification;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface INotificationService
    {
        Task CreateAsync(CreateNotificationRequest request, CancellationToken ct = default);
        Task<IEnumerable<NotificationDto>> GetNotificationsForUserAsync(int userId, CancellationToken ct = default);
        Task MarkAsReadAsync(int notiId, int userId, CancellationToken ct = default);
        Task MarkAllAsReadAsync(int userId, CancellationToken ct = default);
        Task DeleteAsync(int notiId, int userId, CancellationToken ct = default);
    }
}
