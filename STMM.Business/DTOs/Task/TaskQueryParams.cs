namespace STMM.Business.DTOs.Task
{
    public class TaskQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Status { get; set; }
        public string? TaskType { get; set; }
        public int? AssignedToUserId { get; set; }
        public string? Search { get; set; }
    }
}
