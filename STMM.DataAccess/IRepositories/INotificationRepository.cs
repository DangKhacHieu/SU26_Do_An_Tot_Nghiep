using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface INotificationRepository : IBaseRepository<Notification>
    {
        Task<IEnumerable<Notification>> GetNotificationsAsync(string? type, string? targetRole, CancellationToken ct = default);
        Task<Notification?> GetNotificationWithUserByIdAsync(int id, CancellationToken ct = default);
    }
}
