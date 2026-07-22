using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IInvoiceRepository : IBaseRepository<Invoice>
    {
        Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, CancellationToken ct = default);
        Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, int marketId, CancellationToken ct = default);
        Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, int marketId, CancellationToken ct = default);
        Task<List<Invoice>> GetUnpaidInvoicesByStallAsync(int stallId, int marketId, CancellationToken ct = default);
        Task<List<Invoice>> GetInvoicesByVendorAsync(int userId, int? stallId, int? month, int? year, CancellationToken ct = default);
        Task<(List<Invoice> Items, int TotalCount)> GetInvoicesByVendorPagedAsync(int userId, int? stallId, int? month, int? year, int pageNumber, int pageSize, CancellationToken ct = default);
    }
}
