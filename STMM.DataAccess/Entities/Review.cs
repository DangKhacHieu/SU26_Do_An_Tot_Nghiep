using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Đánh giá từ khách hàng
/// </summary>
public partial class Review
{
    /// <summary>
    /// Mã đánh giá
    /// </summary>
    public int ReviewId { get; set; }

    /// <summary>
    /// Đánh giá sạp nào (Nullable nếu là đánh giá chợ)
    /// </summary>
    public int? StallId { get; set; }

    /// <summary>
    /// Đánh giá chợ nào (Nullable nếu là đánh giá sạp)
    /// </summary>
    public int? MarketId { get; set; }

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

    [Column("response")]
    public string? Response { get; set; }

    [Column("status")]
    public string Status { get; set; } = "Pending";

    [Column("responded_at")]
    public DateTime? RespondedAt { get; set; }
    public virtual Stall? Stall { get; set; }

    public virtual Market? Market { get; set; }

    public virtual User User { get; set; } = null!;
}
