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

        public async Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Include(i => i.Payments)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId && i.IsDeleted != true, ct);
        }

        public async Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, CancellationToken ct = default)
        {
            return await _context.Invoices
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId && i.IsDeleted != true, ct);
        }
    }
}
