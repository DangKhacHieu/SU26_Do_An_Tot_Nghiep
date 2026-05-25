using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Market
{
    public int MarketId { get; set; }

    public string MarketName { get; set; } = null!;

    public string? Address { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public virtual ICollection<Area> Areas { get; set; } = new List<Area>();
}
