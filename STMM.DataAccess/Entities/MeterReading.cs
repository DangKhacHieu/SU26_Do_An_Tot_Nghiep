using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class MeterReading
{
    /// <summary>
    /// Mã bản ghi chỉ số điện nước
    /// </summary>
    public int MeterReadingId { get; set; }

    /// <summary>
    /// Liên kết mã công tơ
    /// </summary>
    public int MeterId { get; set; }

    /// <summary>
    /// Chỉ số cũ kỳ trước
    /// </summary>
    public double OldValue { get; set; }

    /// <summary>
    /// Chỉ số mới do Staff nhập
    /// </summary>
    public double NewValue { get; set; }

    /// <summary>
    /// Ngày ghi số thực tế
    /// </summary>
    public DateOnly RecordedAt { get; set; }

    /// <summary>
    /// Định danh Staff ghi số
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Link ảnh chụp mặt đồng hồ để đối soát
    /// </summary>
    public string ImageUrl { get; set; } = null!;

    /// <summary>
    /// Trạng thái đồng bộ dữ liệu
    /// </summary>
    public bool? IsSynced { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual Meter Meter { get; set; } = null!;
}
