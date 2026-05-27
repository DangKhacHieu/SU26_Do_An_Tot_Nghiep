using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class SystemConfig
{
    /// <summary>
    /// Mã cấu hình
    /// </summary>
    public int ConfigId { get; set; }

    /// <summary>
    /// Khóa cấu hình (VD: &quot;invoice_due_days&quot;)
    /// </summary>
    public string ConfigKey { get; set; } = null!;

    /// <summary>
    /// Giá trị cấu hình tương ứng
    /// </summary>
    public string ConfigValue { get; set; } = null!;

    /// <summary>
    /// Mô tả ý nghĩa cấu hình
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Admin/Manager cập nhật cấu hình
    /// </summary>
    public int UpdatedByUserId { get; set; }

    /// <summary>
    /// Thời điểm cập nhật gần nhất
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    public virtual User UpdatedByUser { get; set; } = null!;
}
