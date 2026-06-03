namespace STMM.Business.DTOs.Issue
{
    public class UpdateIssueStatusRequest
    {
        /// <summary>
        /// New status: "InProgress" or "Resolved"
        /// </summary>
        public string NewStatus { get; set; } = string.Empty;
    }
}
