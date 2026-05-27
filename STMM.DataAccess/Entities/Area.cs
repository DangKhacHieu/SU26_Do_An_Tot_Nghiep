using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Area
{
    /// <summary>
    /// Mã khu vực
    /// </summary>
    public int AreaId { get; set; }

    /// <summary>
    /// Thuộc chợ nào
    /// </summary>
    public int MarketId { get; set; }

    /// <summary>
    /// Tên khu vực (VD: &quot;Khu A - Thực phẩm&quot;)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả khu vực
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Tọa độ góc trái dưới trên Floor Map
    /// </summary>
    public double? MinX { get; set; }

    /// <summary>
    /// Tọa độ góc trái dưới trên Floor Map
    /// </summary>
    public double? MinY { get; set; }

    /// <summary>
    /// Tọa độ góc phải trên trên Floor Map
    /// </summary>
    public double? MaxX { get; set; }

    /// <summary>
    /// Tọa độ góc phải trên trên Floor Map
    /// </summary>
    public double? MaxY { get; set; }

    /// <summary>
    /// Ngày khởi tạo
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Đánh dấu xóa mềm
    /// </summary>
    public bool? IsDeleted { get; set; }

    public virtual Market Market { get; set; } = null!;

    public virtual ICollection<Stall> Stalls { get; set; } = new List<Stall>();
}
