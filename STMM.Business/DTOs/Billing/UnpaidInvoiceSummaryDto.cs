using System;

namespace STMM.Business.DTOs.Billing
{
    public class UnpaidInvoiceSummaryDto
    {
        public int InvoiceId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalAmount { get; set; }
        public DateOnly? DueDate { get; set; }
        public string FeeTypeSummary { get; set; } = string.Empty;
    }
}
