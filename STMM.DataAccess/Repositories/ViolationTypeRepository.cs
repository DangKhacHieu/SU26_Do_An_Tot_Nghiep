using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class ViolationTypeRepository : BaseRepository<ViolationType>, IViolationTypeRepository
    {
        public ViolationTypeRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<ViolationType>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AsNoTracking().ToListAsync(cancellationToken);
        }

        public async Task<bool> IsNameExistsAsync(string name, int? excludeId = null, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.ViolationTypes.Where(vt => vt.Name.ToLower() == name.ToLower());
            if (excludeId.HasValue)
            {
                query = query.Where(vt => vt.ViolationTypeId != excludeId.Value);
            }
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AnyAsync(ct);
        }
    }
}
