using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class MarketRepository : BaseRepository<Market>, IMarketRepository
    {
        public MarketRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Market?> GetMarketMapAsync(int marketId, CancellationToken cancellationToken = default)
        {
            var market = await _dbSet
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MarketId == marketId && m.IsDeleted != true, cancellationToken);

            if (market == null) return null;

            var areas = await _context.Areas
                .AsNoTracking()
                .Include(a => a.Category)
                .Include(a => a.Stalls.Where(s => s.IsDeleted != true))
                    .ThenInclude(s => s.Category)
                .Include(a => a.Stalls.Where(s => s.IsDeleted != true))
                    .ThenInclude(s => s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true))
                        .ThenInclude(c => c.Vendor)
                .Where(a => a.MarketId == marketId && a.IsDeleted != true)
                .OrderBy(a => a.AreaId)
                .ToListAsync(cancellationToken);

            market.Areas = areas;
            return market;
        }
    }
}

