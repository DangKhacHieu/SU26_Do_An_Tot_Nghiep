namespace STMM.Business.DTOs.Billing
{
    public class PaymentSummaryDto
    {
        public int PaymentId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = string.Empty;
        public DateTime? PaidAt { get; set; }
    }
}
