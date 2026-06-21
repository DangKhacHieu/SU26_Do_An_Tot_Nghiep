using System;

namespace STMM.Business.DTOs.Request
{
    public class RequestDto
    {
        public int RequestId { get; set; }
        public int VendorId { get; set; }
        public string VendorName { get; set; } = null!;
        public string BusinessName { get; set; } = null!;
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public string RequestType { get; set; } = null!;
        public int? ViolationId { get; set; }
        public int? InvoiceId { get; set; }
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public string? ImageUrl { get; set; }
        public string? Status { get; set; }
        public string? QuotationText { get; set; }
        public decimal? QuotationAmount { get; set; }
        public bool? IsQuoteApproved { get; set; }
        public string? PaidBy { get; set; }
        public int? RepairRating { get; set; }
        public string? RepairComment { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
