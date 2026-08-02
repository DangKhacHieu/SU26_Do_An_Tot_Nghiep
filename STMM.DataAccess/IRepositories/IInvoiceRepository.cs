using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IInvoiceRepository : IBaseRepository<Invoice>
    {
        Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, CancellationToken ct = default);
        Task<Invoice?> GetInvoiceDetailsWithRelationsAsync(int invoiceId, int marketId, CancellationToken ct = default);
        Task<Invoice?> GetInvoiceWithRelationsForPaymentAsync(int invoiceId, int? marketId = null, CancellationToken ct = default);
        Task<List<Invoice>> GetUnpaidInvoicesByStallAsync(int stallId, int? marketId = null, CancellationToken ct = default);
        Task<List<Invoice>> GetInvoicesByVendorAsync(int userId, int? stallId, int? month, int? year, CancellationToken ct = default);
        Task<(List<Invoice> Items, int TotalCount)> GetInvoicesByVendorPagedAsync(int userId, int? stallId, int? month, int? year, int pageNumber, int pageSize, CancellationToken ct = default);
        Task<int> CountInvoicesAsync(int month, int year, string? status = null, int? marketId = null, CancellationToken ct = default);
        Task<decimal> GetTotalRepairCostAsync(int month, int year, int? marketId = null, CancellationToken ct = default);
        Task<List<Invoice>> GetInvoicesWithDetailsAsync(int? month, int? year, string? status, string? search, int? accountantMarketId = null, CancellationToken ct = default);
        Task<List<Invoice>> GetDraftInvoicesByIdsAsync(IEnumerable<int> invoiceIds, int? accountantMarketId = null, CancellationToken ct = default);
        Task<Invoice?> GetDraftOrUnpaidInvoiceForContractAsync(int contractId, int month, int year, CancellationToken ct = default);
        Task<decimal> GetTotalUnpaidAmountByStallIdAsync(int stallId, CancellationToken ct = default);
        Task<bool> ExistsInvoiceForContractAsync(int contractId, int month, int year, CancellationToken ct = default);
        Task<bool> ExistsInvoiceWithFeeTypeForContractAsync(int contractId, int month, int year, int feeTypeId, CancellationToken ct = default);
    }
}
