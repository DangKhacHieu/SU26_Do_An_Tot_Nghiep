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

        public async Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, int marketId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(i =>
                    i.InvoiceId == invoiceId &&
                    i.IsDeleted != true &&
                    i.Contract.Stall.Area.MarketId == marketId,
                    ct);
        }

        public async Task<List<Invoice>> GetUnpaidInvoicesByStallAsync(int stallId, int marketId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Where(i =>
                    i.Contract.StallId == stallId &&
                    i.Contract.Stall.Area.MarketId == marketId &&
                    i.Status == "Unpaid" &&
                    i.IsDeleted != true)
                .OrderBy(i => i.Year)
                .ThenBy(i => i.Month)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        private IQueryable<Invoice> InvoiceDetailsQuery()
        {
            return _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Include(i => i.Payments)
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
    }
}
