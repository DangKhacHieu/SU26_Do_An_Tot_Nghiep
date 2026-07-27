namespace STMM.Business.DTOs.Task
{
    public class CompleteTaskRequest
    {
        public string? ImageBeforeUrl { get; set; }
        public string? ImageAfterUrl { get; set; }
        public string? CompletionNotes { get; set; }
    }
}
