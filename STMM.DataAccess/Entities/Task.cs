using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Tác vụ giao cho nhân viên thực hiện
/// </summary>
public partial class Task
{
    /// <summary>
    /// Mã tác vụ
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// Staff được giao việc
    /// </summary>
    public int AssignedToUserId { get; set; }

    /// <summary>
    /// Nguồn: Yêu cầu từ Vendor (FK → requests)
    /// </summary>
    public int? RequestId { get; set; }

    /// <summary>
    /// Nguồn: Sự cố hạ tầng chung (FK → issues)
    /// </summary>
    public int? IssueId { get; set; }

    /// <summary>
    /// Repair, Maintenance, UtilityReading, CashCollection
    /// </summary>
    public string TaskType { get; set; } = null!;

    /// <summary>
    /// Tiêu đề tác vụ
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết công việc cần làm
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Vòng đời: Pending → PendingApproval → In_Progress → Completed | Cancelled
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Ảnh chụp hiện trạng hỏng hóc trước khi sửa (bắt buộc khi Completed)
    /// </summary>
    public string? ImageBeforeUrl { get; set; }

    /// <summary>
    /// Ảnh chụp nghiệm thu sau khi sửa xong (bắt buộc khi Completed)
    /// </summary>
    public string? ImageAfterUrl { get; set; }

    /// <summary>
    /// Tổng chi phí vật tư thực tế = SUM(task_materials.amount). Kế toán dùng để tính OPEX cuối tháng
    /// </summary>
    public decimal? ActualCost { get; set; }

    /// <summary>
    /// Thời điểm hoàn thành thực tế
    /// </summary>
    public DateTime? CompletedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User AssignedToUser { get; set; } = null!;

    public virtual Issue? Issue { get; set; }

    public virtual Request? Request { get; set; }

    public virtual ICollection<TaskMaterial> TaskMaterials { get; set; } = new List<TaskMaterial>();
}
