namespace STMM.Business.DTOs.Billing
{
    /// <summary>
    /// Staff ghi nhận thu tiền mặt tại sạp. Thu đủ 100% giá trị hóa đơn (BR-36).
    /// Method luôn = "Cash", TransactionCode auto-generate.
    /// </summary>
    public class ReceiveCashPaymentRequest
    {
        /// <summary>
        /// Hóa đơn cần thu tiền — phải ở trạng thái Unpaid
        /// </summary>
        public int InvoiceId { get; set; }
    }
}
