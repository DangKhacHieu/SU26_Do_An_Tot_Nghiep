using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class SystemConfigRepository : BaseRepository<SystemConfig>, ISystemConfigRepository
    {
        public SystemConfigRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<SystemConfig>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AsNoTracking().ToListAsync(cancellationToken);
        }

        public async Task<SystemConfig?> GetSystemConfigByKeyAsync(string key, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null)
                             .OrderByDescending(x => x.MarketId == marketId.Value);
            }
            return await query.FirstOrDefaultAsync(c => c.ConfigKey == key, ct);
        }
    }
}
