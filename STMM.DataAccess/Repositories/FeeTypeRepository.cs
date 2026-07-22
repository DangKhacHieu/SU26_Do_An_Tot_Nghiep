using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class FeeTypeRepository : BaseRepository<FeeType>, IFeeTypeRepository
    {
        public FeeTypeRepository(AppDbContext context) : base(context)
        {
        }

        public new async Task<IEnumerable<FeeType>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default)
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
            var nameTrimmed = name.Trim().ToLower();
            var query = _dbSet.AsQueryable();
            if (excludeId.HasValue)
            {
                query = query.Where(f => f.FeeTypeId != excludeId.Value);
            }
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AnyAsync(f => f.Name.Trim().ToLower() == nameTrimmed, ct);
        }

        public async Task<FeeType?> GetFeeTypeByNameAsync(string name, int? marketId = null, CancellationToken ct = default)
        {
            var nameTrimmed = name.Trim().ToLower();
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.FirstOrDefaultAsync(f => f.Name.Trim().ToLower() == nameTrimmed, ct);
        }

        public async Task<FeeType?> GetFeeTypeByNameContainsAsync(string keyword, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.FirstOrDefaultAsync(f => f.Name.Contains(keyword), ct);
        }

        public async Task<FeeType?> GetRentFeeTypeAsync(int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.FirstOrDefaultAsync(f => f.Name.Contains("thuê") || f.Name.Contains("mặt bằng") || f.FeeTypeId == 1, ct);
        }
    }
}
