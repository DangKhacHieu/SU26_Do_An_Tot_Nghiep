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

        public async Task<Market?> GetMarketWithStallContractsAsync(int marketId, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(m => m.Areas)
                    .ThenInclude(a => a.Stalls)
                        .ThenInclude(s => s.Contracts)
                .FirstOrDefaultAsync(m => m.MarketId == marketId && m.IsDeleted != true, ct);
        }

        public async Task<int> CountUnpaidInvoicesAsync(int marketId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .CountAsync(inv =>
                    inv.Contract.Stall.Area.MarketId == marketId &&
                    (inv.Status == "Unpaid" || inv.Status == "Overdue") &&
                    inv.IsDeleted != true, ct);
        }

        public async Task<int> CountActiveServiceRegistrationsAsync(int marketId, CancellationToken ct = default)
        {
            return await _context.ServiceRegistrations
                .CountAsync(sr =>
                    sr.Stall.Area.MarketId == marketId &&
                    sr.Status == "Active", ct);
        }

        public async Task<System.Collections.Generic.List<int>> DetachAllUsersFromMarketAsync(int marketId, CancellationToken ct = default)
        {
            var users = await _context.Users
                .Where(u => u.MarketId == marketId)
                .ToListAsync(ct);

            var userIds = new System.Collections.Generic.List<int>();
            foreach (var u in users)
            {
                userIds.Add(u.UserId);
                u.MarketId = null;
                _context.Users.Update(u);
            }
            return userIds;
        }

        public async Task DeactivateAllMetersAsync(int marketId, CancellationToken ct = default)
        {
            var meters = await _context.Meters
                .Where(m => m.MarketId == marketId && m.IsActive == true)
                .ToListAsync(ct);

            foreach (var m in meters)
            {
                m.IsActive = false;
                _context.Meters.Update(m);
            }
        }
    }
}

