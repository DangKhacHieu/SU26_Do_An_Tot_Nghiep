using STMM.Business.DTOs.Billing;

namespace STMM.Business.Interfaces
{
    public interface IBillingService
    {
        /// <summary>
        /// Xem chi tiết hóa đơn bao gồm InvoiceDetails, FeeType, Stall, Vendor info.
        /// </summary>
        Task<InvoiceDto> GetInvoiceDetailAsync(int invoiceId, CancellationToken ct = default);

        /// <summary>
        /// Staff ghi nhận thu tiền mặt tại sạp.
        /// Invoice → Pending Confirmation (BR-38c). Gửi notification cho Vendor.
        /// </summary>
        Task<PaymentResultDto> ReceiveCashPaymentAsync(int staffUserId, ReceiveCashPaymentRequest request, CancellationToken ct = default);
    }
}
