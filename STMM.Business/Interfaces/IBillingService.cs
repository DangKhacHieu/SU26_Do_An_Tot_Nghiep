using STMM.Business.DTOs.Billing;

namespace STMM.Business.Interfaces
{
    public interface IBillingService
    {
        /// <summary>
        /// Get invoice detail including InvoiceDetails, FeeType, Stall, and Vendor information.
        /// </summary>
        Task<InvoiceDto> GetInvoiceDetailAsync(int invoiceId, CancellationToken ct = default);

        /// <summary>
        /// Record cash payment collected at the stall.
        /// Updates status to Pending Confirmation and sends notification to Vendor.
        /// </summary>
        Task<PaymentResultDto> ReceiveCashPaymentAsync(int staffUserId, ReceiveCashPaymentRequest request, CancellationToken ct = default);
    }
}
