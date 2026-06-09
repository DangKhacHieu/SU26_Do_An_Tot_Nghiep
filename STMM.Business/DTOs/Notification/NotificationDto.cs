using System;

namespace STMM.Business.DTOs.Notification
{
    public class NotificationDto
    {
        public int NotiId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? NotiType { get; set; }
        public int CreatedByUserId { get; set; }
        public string? TargetRole { get; set; }
        public int? TargetUserId { get; set; }
        public bool? IsRead { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
