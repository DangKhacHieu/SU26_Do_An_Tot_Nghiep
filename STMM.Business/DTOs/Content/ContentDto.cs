using System;

namespace STMM.Business.DTOs.Content
{
    public class ContentDto
    {
        public int NotiId { get; set; }
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? NotiType { get; set; }
        public string? TargetRole { get; set; }
        public int? TargetUserId { get; set; }
        public string? TargetUserName { get; set; }
        public int CreatedByUserId { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
