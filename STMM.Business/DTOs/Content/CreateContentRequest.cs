using System.Collections.Generic;

namespace STMM.Business.DTOs.Content
{
    public class CreateContentRequest
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? NotiType { get; set; } = "Article";
        public string? TargetRole { get; set; }
        public int? TargetUserId { get; set; }
        public List<int>? TargetUserIds { get; set; }
        public int? CreatedByUserId { get; set; }
    }
}
