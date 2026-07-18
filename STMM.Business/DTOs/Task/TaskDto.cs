using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Task
{
    public class TaskDto
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
        public string? Description { get; set; }
        public string Status { get; set; } = null!;
        public string? ImageBeforeUrl { get; set; }
        public string? ImageAfterUrl { get; set; }
        public decimal? ActualCost { get; set; }
        public DateTime? CompletedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? RequestPaidBy { get; set; }
        public List<TaskMaterialDto> Materials { get; set; } = new List<TaskMaterialDto>();
    }
}
