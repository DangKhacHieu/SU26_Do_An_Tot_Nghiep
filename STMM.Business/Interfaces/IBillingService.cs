using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Billing;

namespace STMM.Business.Interfaces
{
    public interface IBillingService
    {
        Task<InvoiceDto> GetInvoiceDetailAsync(int invoiceId, CancellationToken ct = default);
        Task<InvoiceDto> GetInvoiceDetailForAccountantAsync(int invoiceId, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Get invoice detail including InvoiceDetails, FeeType, Stall, and Vendor information.
        /// </summary>
        Task<InvoiceDto> GetInvoiceDetailAsync(int staffUserId, int invoiceId, CancellationToken ct = default);

        /// <summary>
        /// Record cash payment collected at the stall.
        /// Updates status to Pending Confirmation and sends notification to Vendor.
        /// </summary>
        Task<PaymentResultDto> ReceiveCashPaymentAsync(int staffUserId, ReceiveCashPaymentRequest request, CancellationToken ct = default);

        /// <summary>
        /// Get list of unpaid invoices for a specific stall.
        /// </summary>
        Task<List<UnpaidInvoiceSummaryDto>> GetUnpaidInvoicesByStallAsync(int staffUserId, int stallId, CancellationToken ct = default);

        /// <summary>
        /// Get a list of invoices with filters for Month, Year, Status, and search term.
        /// </summary>
        Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(int? month, int? year, string? status, string? search, int? accountantUserId = null, CancellationToken ct = default);

        /// <summary>
        /// Bulk approves invoices and transitions their status from Draft to Unpaid (Issued).
        /// </summary>
        Task<bool> BulkApproveInvoicesAsync(BulkApproveInvoicesRequest request, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Creates a manual ad-hoc invoice (e.g. fines, asset compensation, liquidation fees) for a stall.
        /// </summary>
        Task<InvoiceDto> CreateAdHocInvoiceAsync(CreateAdHocInvoiceRequest request, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Adjusts or back-fills a meter reading and automatically updates/recalculates the corresponding invoice.
        /// </summary>
        Task<bool> AdjustMeterReadingAsync(int creatorUserId, MeterReadingAdjustmentRequest request, CancellationToken ct = default);

        /// <summary>
        /// Retrieves list of payments pending verification (invoice status: Pending Confirmation) or recently approved (Paid).
        /// </summary>
        Task<IEnumerable<PaymentVerificationDto>> GetPendingPaymentsAsync(int? accountantUserId = null, CancellationToken ct = default);

        /// <summary>
        /// Confirms or rejects a payment request.
        /// </summary>
        Task<bool> VerifyPaymentAsync(int paymentId, VerifyPaymentRequest request, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Retrieves all vendors in the accountant's market with their registered services.
        /// </summary>
        Task<IEnumerable<STMM.Business.DTOs.Vendor.AccountantVendorDto>> GetVendorsForAccountantAsync(int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Retrieves debt summary across all stalls.
        /// </summary>
        Task<IEnumerable<DebtOfStallDto>> GetStallsDebtListAsync(string? search, int? accountantUserId = null, CancellationToken ct = default);

        /// <summary>
        /// Retrieves detailed unpaid invoices and violations for a specific stall.
        /// </summary>
        Task<StallDebtDetailDto> GetStallDebtDetailsAsync(int stallId, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Sends a debt notification reminder to the vendor of a stall.
        /// </summary>
        Task<bool> SendDebtReminderAsync(SendDebtNotificationRequest request, int senderUserId, CancellationToken ct = default);

        /// <summary>
        /// Retrieves invoice disputes from Requests.
        /// </summary>
        Task<IEnumerable<DisputeResolutionDto>> GetInvoiceDisputesAsync(int? accountantUserId = null, CancellationToken ct = default);

        /// <summary>
        /// Resolves an invoice dispute request (Approve/Reject).
        /// </summary>
        Task<bool> ResolveInvoiceDisputeAsync(int requestId, ResolveDisputeRequest request, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Tự động lập hóa đơn nháp kỳ hàng tháng cho tất cả các sạp có hợp đồng hoạt động và phí dịch vụ đăng ký tương ứng.
        /// </summary>
        Task<int> AutoGenerateMonthlyInvoicesAsync(int month, int year, CancellationToken ct = default);

        /// <summary>
        /// Hủy hóa đơn (Chỉ áp dụng cho hóa đơn Draft hoặc Unpaid).
        /// </summary>
        Task<bool> CancelInvoiceAsync(int invoiceId, CancelInvoiceRequest request, int accountantUserId, CancellationToken ct = default);

        /// <summary>
        /// Retrieves the history of auto-generated monthly invoices from audit logs.
        /// </summary>
        Task<IEnumerable<AutoGenerateHistoryDto>> GetAutoGenerateHistoryAsync(CancellationToken ct = default);

        /// <summary>
        /// Manually triggers the auto-generation process for a specific month and year.
        /// </summary>
        Task<int> TriggerAutoGenerateAsync(int month, int year, int triggerUserId, CancellationToken ct = default);
    }
}
