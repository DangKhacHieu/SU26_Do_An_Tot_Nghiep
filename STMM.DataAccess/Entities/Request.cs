using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Request
{
    /// <summary>
    /// Mã yêu cầu
    /// </summary>
    public int RequestId { get; set; }

    /// <summary>
    /// Tiểu thương gửi yêu cầu
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Yêu cầu liên quan tới sạp nào
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// FacilityIssue, ViolationAppeal, InvoiceDispute
    /// </summary>
    public string RequestType { get; set; } = null!;

    /// <summary>
    /// Điền nếu Kháng nghị vi phạm
    /// </summary>
    public int? ViolationId { get; set; }

    /// <summary>
    /// Điền nếu Kháng nghị hóa đơn
    /// </summary>
    public int? InvoiceId { get; set; }

    /// <summary>
    /// Tiêu đề yêu cầu
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Trạng thái (Pending, Approved, Rejected, Processing, Completed)
    /// </summary>
    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Invoice? Invoice { get; set; }

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();

    public virtual Stall Stall { get; set; } = null!;

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual Violation? Violation { get; set; }
}
