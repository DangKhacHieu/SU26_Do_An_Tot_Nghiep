using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Danh mục chợ
/// </summary>
public partial class Market
{
    /// <summary>
    /// Mã định danh chợ
    /// </summary>
    public int MarketId { get; set; }

    /// <summary>
    /// Tên chợ
    /// </summary>
    public string MarketName { get; set; } = null!;

    /// <summary>
    /// Địa chỉ chợ
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Ngày khởi tạo
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Đánh dấu xóa mềm
    /// </summary>
    public bool? IsDeleted { get; set; }

    /// <summary>
    /// Diện tích (size)
    /// </summary>
    public double? Size { get; set; }

    /// <summary>
    /// Vòng đời: Draft, Pending, Active, Rejected
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Chuỗi dữ liệu vẽ vector hình dạng chợ tự do
    /// </summary>
    public string? SvgPath { get; set; }

    public double? MinX { get; set; }
    public double? MinY { get; set; }
    public double? MaxX { get; set; }
    public double? MaxY { get; set; }

    public virtual ICollection<Area> Areas { get; set; } = new List<Area>();
}
