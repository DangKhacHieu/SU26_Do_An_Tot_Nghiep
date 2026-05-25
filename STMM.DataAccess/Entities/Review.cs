using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Review
{
    public int Id { get; set; }

    public int StallId { get; set; }

    public int UserId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Stall Stall { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
