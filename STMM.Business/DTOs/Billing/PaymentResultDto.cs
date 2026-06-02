namespace STMM.Business.DTOs.Billing
{
    public class PaymentResultDto
    {
        public int PaymentId { get; set; }
        public int InvoiceId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public string? TransactionCode { get; set; }
        public DateTime? PaidAt { get; set; }

        /// <summary>
        /// Trạng thái hóa đơn sau khi thanh toán (VD: "Pending Confirmation")
        /// </summary>
        public string NewInvoiceStatus { get; set; } = string.Empty;
    }
}
