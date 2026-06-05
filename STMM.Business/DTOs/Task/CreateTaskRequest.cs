namespace STMM.Business.DTOs.Task
{
    public class CreateTaskRequest
    {
        public int AssignedToUserId { get; set; }
        public int? RequestId { get; set; }
        public int? IssueId { get; set; }
        public int? AreaId { get; set; }
        public string TaskType { get; set; } = null!;
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
    }
}
