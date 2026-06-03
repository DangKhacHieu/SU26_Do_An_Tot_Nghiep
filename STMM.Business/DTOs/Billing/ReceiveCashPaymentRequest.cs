namespace STMM.Business.DTOs.Billing
{
    /// <summary>
    /// Staff records cash payment at the stall. Collects 100% of the invoice amount.
    /// Method is always "Cash", TransactionCode is auto-generated.
    /// </summary>
    public class ReceiveCashPaymentRequest
    {
        /// <summary>
        /// Invoice to collect payment - must be in Unpaid status
        /// </summary>
        public int InvoiceId { get; set; }
    }
}
