using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Review
{
    /// <summary>
    /// Mã đánh giá
    /// </summary>
    public int ReviewId { get; set; }

    /// <summary>
    /// Đánh giá sạp nào
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Customer đánh giá
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Điểm (1-5 sao)
    /// </summary>
    public int Rating { get; set; }

    /// <summary>
    /// Nhận xét
    /// </summary>
    public string? Comment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Stall Stall { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
