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
    public class ContractRepository : BaseRepository<Contract>, IContractRepository
    {
        public ContractRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Contract>> GetContractsAsync(string? searchTerm = null, string? status = null, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet
                .Include(c => c.Stall)
                    .ThenInclude(s => s.Area)
                .Include(c => c.Vendor)
                    .ThenInclude(v => v.User)
                .Where(c => c.IsDeleted != true)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(c => c.Stall.Area.MarketId == marketId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(c => c.Stall.Code.ToLower().Contains(term) ||
                                         c.Vendor.User.Name.ToLower().Contains(term) ||
                                         c.Vendor.BusinessName.ToLower().Contains(term));
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(c => c.Status == status);
            }

            return await query.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);
        }

        public async Task<Contract?> GetContractByIdWithDetailsAsync(int contractId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.Stall)
                    .ThenInclude(s => s.Area)
                        .ThenInclude(a => a.Market)
                .Include(c => c.Vendor)
                    .ThenInclude(v => v.User)
                .Include(c => c.ContractFiles)
                .FirstOrDefaultAsync(c => c.ContractId == contractId && c.IsDeleted != true, ct);
        }
    }
}

