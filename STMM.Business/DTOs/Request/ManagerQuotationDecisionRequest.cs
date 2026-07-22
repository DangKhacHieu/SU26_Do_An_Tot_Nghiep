namespace STMM.Business.DTOs.Request
{
    public sealed class ManagerQuotationDecisionRequest
    {
        public const string ApproveAsMarket = "ApproveAsMarket";
        public const string SendToVendor = "SendToVendor";
        public const string ReturnForRevision = "ReturnForRevision";
        public const string Reject = "Reject";

        public const string OtherContractClause = "Khác / Không áp dụng điều khoản cụ thể";

        public string Action { get; set; } = string.Empty;
        public string? DecisionNote { get; set; }
        public string? ContractClause { get; set; }
    }
}
