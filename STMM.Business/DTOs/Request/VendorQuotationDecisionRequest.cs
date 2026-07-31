namespace STMM.Business.DTOs.Request
{
    public sealed class VendorQuotationDecisionRequest
    {
        public bool Approve { get; set; }
        public string? RejectReason { get; set; }
    }
}
