using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Danh mục ngành hàng kinh doanh
/// </summary>
public partial class BusinessCategory
{
    /// <summary>
    /// Mã định danh ngành hàng
    /// </summary>
    public int CategoryId { get; set; }

    /// <summary>
    /// Mã code ngành hàng (VD: FOOD, FASHION)
    /// </summary>
    public string Code { get; set; } = null!;

    /// <summary>
    /// Tên ngành hàng (VD: Thực phẩm tươi sống, Quần áo)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết và các quy định riêng cho ngành hàng này
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Trạng thái hoạt động
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Thuộc chợ nào (Nullable nếu là ngành hàng chung toàn hệ thống)
    /// </summary>
    public int? MarketId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Market? Market { get; set; }

    public virtual ICollection<Area> Areas { get; set; } = new List<Area>();

    public virtual ICollection<Stall> Stalls { get; set; } = new List<Stall>();
}
