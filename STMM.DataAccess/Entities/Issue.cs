using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Sự cố hạ tầng chung do nhân viên báo cáo
/// </summary>
public partial class Issue
{
    /// <summary>
    /// Mã sự cố
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// Sự cố tại khu vực gần sạp nào (dùng để định vị địa lý)
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Staff báo cáo sự cố khi đi tuần
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Mô tả ngắn gọn sự cố
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Chi tiết tình trạng hỏng hóc hạ tầng chung
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Ảnh chụp hiện trường sự cố
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Vòng đời: Reported → InProgress → Resolved | Closed
    /// </summary>
    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual Stall Stall { get; set; } = null!;

    public virtual ICollection<Task> Tasks { get; set; } = new List<Task>();
}
