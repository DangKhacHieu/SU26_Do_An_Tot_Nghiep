using System.Collections.Generic;

namespace STMM.Business.DTOs.Content
{
    public class CreateContentRequest
    {
        public string Title { get; set; } = null!;
        public string Content { get; set; } = null!;
        public string? NotiType { get; set; } = "Article"; // "Article" or "Announcement"
        public string? TargetRole { get; set; } // "Public", "Staff", "Accountant", "Vendor", "Customer"
        public int? TargetUserId { get; set; } // Single recipient
        public List<int>? TargetUserIds { get; set; } // Multiple recipients
        public int? CreatedByUserId { get; set; }
    }
}
