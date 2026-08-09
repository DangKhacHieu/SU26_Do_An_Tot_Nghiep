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
                if (status == "Terminated")
                {
                    query = query.Where(c => c.Status == "Terminated" || c.Status == "TerminatedEarly");
                }
                else
                {
                    query = query.Where(c => c.Status == status);
                }
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
        public async Task<Contract?> GetActiveContractByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.Stall)
                    .ThenInclude(s => s.Area)
                .Include(c => c.Vendor)
                    .ThenInclude(v => v.User)
                .Where(c => c.StallId == stallId && c.Status == "Active" && c.IsDeleted != true)
                .FirstOrDefaultAsync(ct);
        }

        public async Task<List<Stall>> GetStallsWithDebtAsync(int? accountantMarketId = null, string? search = null, CancellationToken ct = default)
        {
            var query = _dbSet
                .Select(c => c.Stall)
                .Distinct();

            if (accountantMarketId.HasValue)
            {
                query = query.Where(s => s.Area.MarketId == accountantMarketId.Value);
            }

            var stallsQuery = query
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                        .ThenInclude(i => i.InvoiceDetails)
                            .ThenInclude(d => d.FeeType)
                .Include(s => s.Violations)
                    .ThenInclude(v => v.ViolationType)
                .AsQueryable();

            var stalls = await stallsQuery.ToListAsync(ct);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sLower = search.ToLower();
                stalls = stalls.Where(s => s.Code.ToLower().Contains(sLower) || 
                                          (s.Contracts.FirstOrDefault(c => c.Status == "Active")?.Vendor?.User?.Name ?? "").ToLower().Contains(sLower)).ToList();
            }

            return stalls;
        }

        public async Task<Stall?> GetStallWithDebtDetailsAsync(int stallId, CancellationToken ct = default)
        {
            return await _dbSet
                .Where(c => c.StallId == stallId)
                .Select(c => c.Stall)
                .Distinct()
                .Include(s => s.Area)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                        .ThenInclude(i => i.InvoiceDetails)
                            .ThenInclude(d => d.FeeType)
                .Include(s => s.Violations)
                    .ThenInclude(v => v.ViolationType)
                .FirstOrDefaultAsync(ct);
        }

        public async Task<List<Contract>> GetAllActiveContractsWithDetailsAsync(CancellationToken ct = default)
        {
            return await _dbSet
                .Include(c => c.Stall)
                .Include(c => c.Vendor)
                .Where(c => c.Status == "Active" && c.IsDeleted != true)
                .ToListAsync(ct);
        }

        public async Task<List<Contract>> GetActiveContractsForBillingAsync(int targetMonth, int targetYear, CancellationToken ct = default)
        {
            var targetStart = new DateOnly(targetYear, targetMonth, 1);
            var targetEnd = new DateOnly(targetYear, targetMonth, System.DateTime.DaysInMonth(targetYear, targetMonth));

            // Includes all necessary relations to avoid N+1 during billing
            return await _dbSet
                .Include(c => c.Stall)
                    .ThenInclude(s => s.Area)
                .Include(c => c.Stall)
                    .ThenInclude(s => s.ServiceRegistrations)
                        .ThenInclude(sr => sr.Service)
                .Where(c => c.IsDeleted != true
                            && c.StartDate <= targetEnd
                            && c.EndDate >= targetStart
                            && (c.Status == "Active" || c.Status == "Expired" || c.Status == "Terminated" || c.Status == "TerminatedEarly"))
                .ToListAsync(ct);
        }
    }
}

