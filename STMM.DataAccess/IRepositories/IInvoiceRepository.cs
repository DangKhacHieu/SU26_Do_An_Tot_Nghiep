using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IInvoiceRepository : IBaseRepository<Invoice>
    {
        Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, CancellationToken ct = default);
        Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, CancellationToken ct = default);
    }
}
