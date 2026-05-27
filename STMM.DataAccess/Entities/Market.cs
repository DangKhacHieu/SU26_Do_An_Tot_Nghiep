using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

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

    public virtual ICollection<Area> Areas { get; set; } = new List<Area>();
}
