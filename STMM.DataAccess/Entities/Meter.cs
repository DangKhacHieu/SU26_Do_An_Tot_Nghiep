using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Thông tin công tơ điện nước
/// </summary>
public partial class Meter
{
    /// <summary>
    /// Mã công tơ
    /// </summary>
    public int MeterId { get; set; }

    /// <summary>
    /// Lắp đặt tại sạp nào (nullable khi nằm trong kho)
    /// </summary>
    public int? StallId { get; set; }

    /// <summary>
    /// Loại công tơ (Electricity, Water)
    /// </summary>
    public string Type { get; set; } = null!;

    /// <summary>
    /// Số seri trên mặt đồng hồ
    /// </summary>
    public string SerialNumber { get; set; } = null!;

    /// <summary>
    /// Ngày lắp đặt
    /// </summary>
    public DateOnly? InstalledAt { get; set; }

    /// <summary>
    /// Công tơ còn hoạt động hay đã thay thế
    /// </summary>
    public bool? IsActive { get; set; }

    /// <summary>
    /// Thuộc chợ nào
    /// </summary>
    public int MarketId { get; set; }

    public virtual ICollection<MeterReading> MeterReadings { get; set; } = new List<MeterReading>();

    public virtual Stall? Stall { get; set; }

    public virtual Market Market { get; set; } = null!;
}
