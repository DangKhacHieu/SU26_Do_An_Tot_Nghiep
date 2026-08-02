using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class NotificationRepository : BaseRepository<Notification>, INotificationRepository
    {
        public NotificationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Notification>> GetNotificationsAsync(string? type, string? targetRole, CancellationToken ct = default)
        {
            IQueryable<Notification> query = _dbSet.AsQueryable()
                .Include(n => n.TargetUser)
                .Include(n => n.CreatedByUser);

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(n => n.NotiType == type);
            }

            if (!string.IsNullOrEmpty(targetRole))
            {
                query = query.Where(n => n.TargetRole == targetRole);
            }

            return await query.OrderByDescending(n => n.CreatedAt).ToListAsync(ct);
        }

        public async Task<Notification?> GetNotificationWithUserByIdAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet.AsQueryable()
                .Include(n => n.TargetUser)
                .Include(n => n.CreatedByUser)
                .FirstOrDefaultAsync(n => n.NotiId == id, ct);
        }

        public override async Task<IEnumerable<Notification>> FindAsync(System.Linq.Expressions.Expression<System.Func<Notification, bool>> predicate, CancellationToken cancellationToken = default)
        {
            return await _dbSet.AsQueryable()
                .Include(n => n.CreatedByUser)
                .Include(n => n.TargetUser)
                .Where(predicate)
                .AsNoTracking()
                .ToListAsync(cancellationToken);
        }
    }
}
