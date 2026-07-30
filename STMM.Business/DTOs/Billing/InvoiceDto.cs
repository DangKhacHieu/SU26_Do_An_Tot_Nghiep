namespace STMM.Business.DTOs.Billing
{
    public class InvoiceDto
    {
        public int InvoiceId { get; set; }
        public int ContractId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateOnly? DueDate { get; set; }
        public DateTime? CreatedAt { get; set; }

        // Stall info
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public string? StallCategory { get; set; }

        // Vendor info
        public string VendorName { get; set; } = string.Empty;
        public string VendorPhone { get; set; } = string.Empty;

        // Nested details
        public IEnumerable<InvoiceDetailDto> Details { get; set; } = Enumerable.Empty<InvoiceDetailDto>();
        public IEnumerable<PaymentSummaryDto> Payments { get; set; } = Enumerable.Empty<PaymentSummaryDto>();

        // Computed logic
        public string InvoiceType { get; set; } = "Periodic";
    }
}
