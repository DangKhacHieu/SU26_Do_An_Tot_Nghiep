using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class InvoiceRepository : BaseRepository<Invoice>, IInvoiceRepository
    {
        public InvoiceRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(
            int invoiceId,
            CancellationToken ct = default)
        {
            return await InvoiceDetailsQuery()
                .FirstOrDefaultAsync(i =>
                    i.InvoiceId == invoiceId && i.IsDeleted != true,
                    ct);
        }

        public async Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, int marketId, CancellationToken ct = default)
        {
            return await InvoiceDetailsQuery()
                .FirstOrDefaultAsync(i =>
                    i.InvoiceId == invoiceId &&
                    i.IsDeleted != true &&
                    i.Contract.Stall.Area.MarketId == marketId,
                    ct);
        }

        public async Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .Where(i => i.InvoiceId == invoiceId && i.IsDeleted != true);

            if (marketId.HasValue)
                query = query.Where(i => i.Contract.Stall.Area.MarketId == marketId.Value);

            return await query.FirstOrDefaultAsync(ct);
        }

        public async Task<List<Invoice>> GetUnpaidInvoicesByStallAsync(int stallId, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Where(i => i.Contract.StallId == stallId && i.Status == "Unpaid" && i.IsDeleted != true);

            if (marketId.HasValue)
                query = query.Where(i => i.Contract.Stall.Area.MarketId == marketId.Value);

            return await query.OrderBy(i => i.Year).ThenBy(i => i.Month).AsNoTracking().ToListAsync(ct);
        }

        private IQueryable<Invoice> InvoiceDetailsQuery()
        {
            return _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Include(i => i.Payments)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Area)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .AsNoTracking();
        }

        public async Task<List<Invoice>> GetInvoicesByVendorAsync(int userId, int? stallId, int? month, int? year, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.Contract)
                .ThenInclude(c => c.Stall)
                .Include(i => i.Contract.Vendor)
                .ThenInclude(v => v.User)
                .Include(i => i.InvoiceDetails)
                .ThenInclude(d => d.FeeType)
                .AsQueryable();

            // Lọc theo Vendor (BR-06)
            query = query.Where(i => i.Contract.Vendor.UserId == userId && i.Contract.Status == "Active");

            // Xóa mềm và chỉ lấy hóa đơn chính thức
            query = query.Where(i => i.IsDeleted != true && i.Contract.IsDeleted != true);
            query = query.Where(i => i.Status == "Unpaid" || i.Status == "Paid" || i.Status == "Overdue");

            if (stallId.HasValue && stallId.Value > 0)
            {
                query = query.Where(i => i.Contract.StallId == stallId.Value);
            }

            if (month.HasValue && month.Value > 0)
            {
                query = query.Where(i => i.Month == month.Value);
            }

            if (year.HasValue && year.Value > 0)
            {
                query = query.Where(i => i.Year == year.Value);
            }

            return await query
                .OrderByDescending(i => i.Year)
                .ThenByDescending(i => i.Month)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<(List<Invoice> Items, int TotalCount)> GetInvoicesByVendorPagedAsync(int userId, int? stallId, int? month, int? year, int pageNumber, int pageSize, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.Contract)
                .ThenInclude(c => c.Stall)
                .Include(i => i.Contract.Vendor)
                .ThenInclude(v => v.User)
                .Include(i => i.InvoiceDetails)
                .ThenInclude(d => d.FeeType)
                .AsQueryable();

            query = query.Where(i => i.Contract.Vendor.UserId == userId && i.Contract.Status == "Active");
            query = query.Where(i => i.IsDeleted != true && i.Contract.IsDeleted != true);
            query = query.Where(i => i.Status == "Unpaid" || i.Status == "Paid" || i.Status == "Overdue");

            if (stallId.HasValue && stallId.Value > 0)
            {
                query = query.Where(i => i.Contract.StallId == stallId.Value);
            }

            if (month.HasValue && month.Value > 0)
            {
                query = query.Where(i => i.Month == month.Value);
            }

            if (year.HasValue && year.Value > 0)
            {
                query = query.Where(i => i.Year == year.Value);
            }

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(i => i.Year)
                .ThenByDescending(i => i.Month)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<int> CountInvoicesAsync(int month, int year, string? status = null, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices.Where(i => i.IsDeleted != true && i.Month == month && i.Year == year);
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }
            if (marketId.HasValue)
            {
                query = query.Where(i => i.Contract.Stall.Area.MarketId == marketId.Value);
            }
            return await query.CountAsync(ct);
        }

        public async Task<decimal> GetTotalRepairCostAsync(int month, int year, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices.Where(i => i.IsDeleted != true && i.Month == month && i.Year == year);
            if (marketId.HasValue)
            {
                query = query.Where(i => i.Contract.Stall.Area.MarketId == marketId.Value);
            }
            return await query.SelectMany(i => i.InvoiceDetails)
                .Where(d => d.FeeType.Name.ToLower().Contains("sửa") || 
                            d.FeeType.Name.ToLower().Contains("repair") || 
                            d.Description!.ToLower().Contains("sửa"))
                .SumAsync(d => (decimal?)d.Amount, ct) ?? 0;
        }

        public async Task<List<Invoice>> GetInvoicesWithDetailsAsync(int? month, int? year, string? status, string? search, int? accountantMarketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Where(i => i.IsDeleted != true);

            if (accountantMarketId.HasValue)
            {
                query = query.Where(i => i.Contract.Stall.Area.MarketId == accountantMarketId.Value);
            }

            if (month.HasValue && month.Value > 0)
            {
                query = query.Where(i => i.Month == month.Value);
            }

            if (year.HasValue && year.Value > 0)
            {
                query = query.Where(i => i.Year == year.Value);
            }

            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(i => i.Status == status);
            }
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(i => i.InvoiceId.ToString().Contains(searchLower) || 
                                     i.Contract.Stall.Code.ToLower().Contains(searchLower) || 
                                     i.Contract.Vendor.User.Name.ToLower().Contains(searchLower) ||
                                     i.Contract.Vendor.BusinessName.ToLower().Contains(searchLower));
            }

            return await query.OrderByDescending(i => i.InvoiceId).ToListAsync(ct);
        }

        public async Task<List<Invoice>> GetDraftInvoicesByIdsAsync(IEnumerable<int> invoiceIds, int? accountantMarketId = null, CancellationToken ct = default)
        {
            var query = _context.Invoices
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Area)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Where(i => invoiceIds.Contains(i.InvoiceId) && i.Status == "Draft" && i.IsDeleted != true);

            if (accountantMarketId.HasValue)
            {
                query = query.Where(i => i.Contract.Stall.Area.MarketId == accountantMarketId.Value);
            }

            return await query.ToListAsync(ct);
        }

        public async Task<Invoice?> GetDraftOrUnpaidInvoiceForContractAsync(int contractId, int month, int year, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Where(i => i.ContractId == contractId && 
                             i.Month == month && 
                             i.Year == year && 
                             i.IsDeleted != true &&
                             (i.Status == "Draft" || i.Status == "Unpaid"))
                .FirstOrDefaultAsync(ct);
        }

        public async Task<decimal> GetTotalUnpaidAmountByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Where(i => i.Contract.StallId == stallId && i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation"))
                .SumAsync(i => i.TotalAmount, ct);
        }

        public async Task<bool> ExistsInvoiceForContractAsync(int contractId, int month, int year, CancellationToken ct = default)
        {
            return await _context.Invoices
                .AnyAsync(i => i.ContractId == contractId && 
                               i.Month == month && 
                               i.Year == year && 
                               i.IsDeleted != true && 
                               i.Status != "Canceled", ct);
        }
    }
}
