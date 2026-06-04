namespace STMM.Business.DTOs.Content
{
    public class UpdateContentRequest
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? NotiType { get; set; }
        public string? TargetRole { get; set; }
        public int? TargetUserId { get; set; }
    }
}
