using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class StaffTask
{
    /// <summary>
    /// Mã tác vụ
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// Staff được giao việc (Nhiệm vụ chung)
    /// </summary>
    public int AssignedToUserId { get; set; }

    /// <summary>
    /// Nguồn: Yêu cầu từ Vendor
    /// </summary>
    public int? RequestId { get; set; }

    /// <summary>
    /// Nguồn: Sự cố nội bộ
    /// </summary>
    public int? IssueId { get; set; }

    /// <summary>
    /// Repair, Maintenance, UtilityReading, CashCollection
    /// </summary>
    public string TaskType { get; set; } = null!;

    /// <summary>
    /// Lý do hoàn thành trễ hạn do Staff nhập khi đóng task quá hạn
    /// </summary>
    public string? OverdueReason { get; set; }

    /// <summary>
    /// Tiêu đề tác vụ
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Pending, In_Progress, Completed, Overdue
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Hạn chót
    /// </summary>
    public DateTime Deadline { get; set; }

    /// <summary>
    /// Thời điểm hoàn thành
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User AssignedToUser { get; set; } = null!;

    public virtual Issue? Issue { get; set; }

    public virtual Request? Request { get; set; }
}
