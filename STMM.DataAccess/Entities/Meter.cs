using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Meter
{
    /// <summary>
    /// Mã công tơ
    /// </summary>
    public int MeterId { get; set; }

    /// <summary>
    /// Lắp đặt tại sạp nào
    /// </summary>
    public int StallId { get; set; }

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

    public virtual ICollection<MeterReading> MeterReadings { get; set; } = new List<MeterReading>();

    public virtual Stall Stall { get; set; } = null!;
}
