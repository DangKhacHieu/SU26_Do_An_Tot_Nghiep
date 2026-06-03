using STMM.Business.DTOs.Notification;

namespace STMM.Business.Interfaces
{
    public interface INotificationService
    {
        /// <summary>
        /// Create a new notification in the system.
        /// TargetUserId XOR TargetRole (not both).
        /// </summary>
        Task CreateAsync(CreateNotificationRequest request, CancellationToken ct = default);
    }
}
