using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Violation
{
    /// <summary>
    /// Mã vi phạm
    /// </summary>
    public int ViolationId { get; set; }

    /// <summary>
    /// Sạp vi phạm
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Staff lập biên bản
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Loại vi phạm (FK tới violation_types)
    /// </summary>
    public int ViolationTypeId { get; set; }

    /// <summary>
    /// Tiêu đề vi phạm
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Minh chứng hình ảnh
    /// </summary>
    public string ImageUrl { get; set; } = null!;

    /// <summary>
    /// Số tiền phạt thực tế (VNĐ) - auto-fill từ default_fine, Staff có thể override
    /// </summary>
    public decimal? FineAmount { get; set; }

    /// <summary>
    /// Trạng thái (Pending, Notified, Appealed, Finalized)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Thời điểm thông báo cho Vendor
    /// </summary>
    public DateTime? NotifiedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual Stall Stall { get; set; } = null!;

    public virtual ViolationType ViolationType { get; set; } = null!;
}
