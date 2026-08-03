using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Request
{
    public class VendorQuotationDecisionRequest
    {
        [Required]
        public bool IsApproved { get; set; }

        public string? Reason { get; set; }
    }
}

