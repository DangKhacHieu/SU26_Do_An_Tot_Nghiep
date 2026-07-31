namespace STMM.Business.DTOs.Task
{
    public class CompleteTaskRequest
    {
        public Microsoft.AspNetCore.Http.IFormFile? ImageBefore { get; set; }
        public Microsoft.AspNetCore.Http.IFormFile? ImageAfter { get; set; }
        public string? CompletionNotes { get; set; }
    }
}
