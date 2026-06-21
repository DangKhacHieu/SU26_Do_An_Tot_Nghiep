using System;

namespace STMM.Business.DTOs.Task
{
    public class TaskSummaryDto
    {
        public int TaskId { get; set; }
        public int AssignedToUserId { get; set; }
        public string AssignedToName { get; set; } = null!;
        public int? RequestId { get; set; }
        public int? IssueId { get; set; }
        public int? AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? StallId { get; set; }
        public string? StallCode { get; set; }
        public string TaskType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string Status { get; set; } = null!;
        public decimal? ActualCost { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
    }
}
