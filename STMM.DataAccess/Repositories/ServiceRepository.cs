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
    public class ServiceRepository : BaseRepository<Service>, IServiceRepository
    {
        public ServiceRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Service>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AsNoTracking().ToListAsync(cancellationToken);
        }

        public async Task<bool> IsFeeTypeInUseAsync(int feeTypeId, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AnyAsync(s => s.FeeTypeId == feeTypeId && s.IsActive != false, ct);
        }

        public async Task<IEnumerable<Service>> GetServicesWithFeeTypeAsync(int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.Include(s => s.FeeType).AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.ToListAsync(ct);
        }

        public async Task<bool> IsNameExistsAsync(string name, int? excludeId = null, int? marketId = null, CancellationToken ct = default)
        {
            var nameTrimmed = name.Trim().ToLower();
            var query = _dbSet.Where(s => s.IsActive != false);
            if (excludeId.HasValue)
            {
                query = query.Where(s => s.ServiceId != excludeId.Value);
            }
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.AnyAsync(s => s.Name.Trim().ToLower() == nameTrimmed, ct);
        }

        public async Task<Service?> GetServiceWithFeeTypeByIdAsync(int id, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.Include(s => s.FeeType).AsQueryable();
            if (marketId.HasValue)
            {
                query = query.Where(x => x.MarketId == marketId.Value || x.MarketId == null);
            }
            return await query.FirstOrDefaultAsync(s => s.ServiceId == id, ct);
        }
    }
}
