using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class PaymentRepository : BaseRepository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<decimal> GetTotalRevenueAsync(DateTime startDate, DateTime endDate, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Payments.Where(p => p.PaidAt >= startDate && p.PaidAt < endDate);
            if (marketId.HasValue)
            {
                query = query.Where(p => p.Invoice.Contract.Stall.Area.MarketId == marketId.Value);
            }
            return await query.SumAsync(p => (decimal?)p.Amount, ct) ?? 0;
        }

        public async Task<List<Payment>> GetRecentPaymentsAsync(int count, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Stall)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                            .ThenInclude(v => v.User)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(p => p.Invoice.Contract.Stall.Area.MarketId == marketId.Value);
            }

            return await query
                .OrderByDescending(p => p.PaidAt)
                .Take(count)
                .AsNoTracking()
                .ToListAsync(ct);
        }
        public async Task<List<Payment>> GetPendingPaymentsWithDetailsAsync(int? accountantMarketId = null, CancellationToken ct = default)
        {
            var query = _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Stall)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                            .ThenInclude(v => v.User)
                .AsQueryable();

            if (accountantMarketId.HasValue)
            {
                query = query.Where(p => p.Invoice.Contract.Stall.Area.MarketId == accountantMarketId.Value);
            }

            return await query
                .OrderByDescending(p => p.PaidAt)
                .ToListAsync(ct);
        }

        public async Task<Payment?> GetPaymentWithInvoiceAndVendorAsync(int paymentId, CancellationToken ct = default)
        {
            return await _context.Payments
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Stall)
                            .ThenInclude(s => s.Area)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId, ct);
        }
    }
}
