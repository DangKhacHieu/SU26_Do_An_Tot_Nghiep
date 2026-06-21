using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Khu vực trong chợ
/// </summary>
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
    /// Ngành hàng chủ đạo của khu vực này (Tùy chọn)
    /// </summary>
    public int? CategoryId { get; set; }

    /// <summary>
    /// Tên khu vực (VD: &quot;Khu A - Thực phẩm&quot;)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả khu vực
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Diện tích (size)
    /// </summary>
    public double? Size { get; set; }

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

    public virtual BusinessCategory? Category { get; set; }

    public virtual Market Market { get; set; } = null!;

    public virtual ICollection<Stall> Stalls { get; set; } = new List<Stall>();

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();
}
