using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class AuditLog
{
    /// <summary>
    /// Mã bản ghi nhật ký
    /// </summary>
    public int LogId { get; set; }

    /// <summary>
    /// Người dùng thực hiện hành động
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Mô tả hành động (VD: &quot;Tạo hóa đơn&quot;, &quot;Xóa sạp&quot;)
    /// </summary>
    public string Action { get; set; } = null!;

    /// <summary>
    /// Địa chỉ IP của thiết bị thực hiện
    /// </summary>
    public string? IpAddress { get; set; }

    /// <summary>
    /// Thời điểm ghi nhận
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
