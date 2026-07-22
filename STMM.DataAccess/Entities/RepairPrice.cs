using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Danh mục đơn giá vật tư sửa chữa
/// </summary>
public partial class RepairPrice
{
    /// <summary>
    /// Mã định danh hạng mục giá sửa chữa
    /// </summary>
    public int RepairPriceId { get; set; }

    /// <summary>
    /// Tên vật tư/thiết bị (VD: Bóng đèn tuýp, Vòi nước inox). Dòng đặc biệt &quot;Vật tư khác&quot; dùng khi vật tư ngoài danh mục — Staff tự nhập đơn giá
    /// </summary>
    public string ItemName { get; set; } = null!;

    /// <summary>
    /// Đơn vị tính (Cái, Mét, Bộ, Công...)
    /// </summary>
    public string Unit { get; set; } = null!;

    /// <summary>
    /// Đơn giá áp dụng (VNĐ). Bằng 0 nếu là dòng &quot;Vật tư khác&quot; — Staff override khi chọn
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Mô tả chi tiết quy cách vật tư
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Trạng thái hoạt động (ẩn/hiện khỏi danh sách chọn)
    /// </summary>
    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<TaskMaterial> TaskMaterials { get; set; } = new List<TaskMaterial>();

    public int? MarketId { get; set; }
    public virtual Market? Market { get; set; }
}
