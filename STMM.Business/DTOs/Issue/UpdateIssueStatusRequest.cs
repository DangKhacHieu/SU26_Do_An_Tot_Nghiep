namespace STMM.Business.DTOs.Issue
{
    public class UpdateIssueStatusRequest
    {
        /// <summary>
        /// Trạng thái mới: "InProgress" hoặc "Resolved" (BR-50)
        /// </summary>
        public string NewStatus { get; set; } = string.Empty;
    }
}
