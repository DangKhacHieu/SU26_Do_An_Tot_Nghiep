using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Notification
{
    /// <summary>
    /// Mã thông báo
    /// </summary>
    public int NotiId { get; set; }

    /// <summary>
    /// Tiêu đề thông báo
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Nội dung chi tiết thông báo
    /// </summary>
    public string Content { get; set; } = null!;

    /// <summary>
    /// Loại thông báo (System, Invoice, Violation, Request)
    /// </summary>
    public string? NotiType { get; set; }

    /// <summary>
    /// Người tạo thông báo
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Gửi tới toàn bộ vai trò (broadcast)
    /// </summary>
    public string? TargetRole { get; set; }

    /// <summary>
    /// Gửi tới cá nhân cụ thể
    /// </summary>
    public int? TargetUserId { get; set; }

    /// <summary>
    /// Trạng thái đã đọc
    /// </summary>
    public bool? IsRead { get; set; }

    /// <summary>
    /// Thời điểm tạo thông báo
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual User? TargetUser { get; set; }
}
