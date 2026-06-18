using System;

namespace STMM.Business.DTOs.Request
{
    public class CreateRequestDto
    {
        public int StallId { get; set; }
        public string RequestType { get; set; } = string.Empty;
        public int? ViolationId { get; set; }
        public int? InvoiceId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }
}
