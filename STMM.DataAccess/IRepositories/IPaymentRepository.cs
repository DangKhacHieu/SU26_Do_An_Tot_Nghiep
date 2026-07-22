using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IPaymentRepository : IBaseRepository<Payment>
    {
        Task<decimal> GetTotalRevenueAsync(DateTime startDate, DateTime endDate, int? marketId = null, CancellationToken ct = default);
        Task<List<Payment>> GetRecentPaymentsAsync(int count, int? marketId = null, CancellationToken ct = default);
        Task<List<Payment>> GetPendingPaymentsWithDetailsAsync(int? accountantMarketId = null, CancellationToken ct = default);
        Task<Payment?> GetPaymentWithInvoiceAndVendorAsync(int paymentId, CancellationToken ct = default);
    }
}
