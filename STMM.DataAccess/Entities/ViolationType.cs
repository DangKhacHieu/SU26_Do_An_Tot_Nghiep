using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class ViolationType
{
    /// <summary>
    /// Mã loại vi phạm
    /// </summary>
    public int ViolationTypeId { get; set; }

    /// <summary>
    /// Tên loại vi phạm (VD: Lấn chiếm, Vệ sinh, PCCC, Kinh doanh trái phép)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết loại vi phạm
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Mức phạt mặc định theo loại (VNĐ)
    /// </summary>
    public decimal? DefaultFine { get; set; }

    /// <summary>
    /// Đánh dấu ẩn/hiện loại vi phạm
    /// </summary>
    public bool? IsActive { get; set; }

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
