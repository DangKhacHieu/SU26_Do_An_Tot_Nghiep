using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class AreaRepository : BaseRepository<Area>, IAreaRepository
    {
        public AreaRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Area>> GetAllAreasAsync(int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet
                .Include(a => a.Category)
                .Include(a => a.Market)
                .Where(a => a.IsDeleted != true)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(a => a.MarketId == marketId.Value);
            }

            return await query.ToListAsync(ct);
        }

        public async Task<Area?> GetAreaByIdAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(a => a.Category)
                .Include(a => a.Market)
                .FirstOrDefaultAsync(a => a.AreaId == id && a.IsDeleted != true, ct);
        }
    }
}
