using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace STMM.DataAccess.Repositories
{
    public class RepairPriceRepository : BaseRepository<RepairPrice>, IRepairPriceRepository
    {
        public RepairPriceRepository(AppDbContext context) : base(context)
        {
        }

        public new async Task<IEnumerable<RepairPrice>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AsNoTracking().ToListAsync(cancellationToken);
        }

        public async Task<bool> IsItemNameExistsAsync(string itemName, int? excludeId = null, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.RepairPrices.AsQueryable();

            if (excludeId.HasValue)
            {
                query = query.Where(r => r.RepairPriceId != excludeId.Value);
            }

            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }

            return await query.AnyAsync(r => r.ItemName.ToLower() == itemName.ToLower(), ct);
        }
    }
}
