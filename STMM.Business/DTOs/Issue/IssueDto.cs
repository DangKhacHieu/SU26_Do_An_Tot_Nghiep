namespace STMM.Business.DTOs.Issue
{
    public class IssueDto
    {
        public int IssueId { get; set; }
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public string Status { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        /// <summary>
        /// StaffTask.TaskId nếu issue đã được giao cho staff xử lý
        /// </summary>
        public int? AssignedTaskId { get; set; }

        /// <summary>
        /// StaffTask.Status nếu có task liên kết
        /// </summary>
        public string? AssignedTaskStatus { get; set; }
    }
}
