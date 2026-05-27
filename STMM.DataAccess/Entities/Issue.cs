using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Issue
{
    /// <summary>
    /// Mã sự cố
    /// </summary>
    public int IssueId { get; set; }

    /// <summary>
    /// Sự cố tại sạp nào
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Staff báo cáo
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Mô tả ngắn gọn
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Chi tiết tình trạng
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Ảnh sự cố
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Trạng thái (Reported, InProgress, Resolved)
    /// </summary>
    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();

    public virtual Stall Stall { get; set; } = null!;
}
