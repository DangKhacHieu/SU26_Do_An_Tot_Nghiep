using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Area
{
    public int AreaId { get; set; }

    public int MarketId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public double? MinX { get; set; }

    public double? MinY { get; set; }

    public double? MaxX { get; set; }

    public double? MaxY { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public virtual Market Market { get; set; } = null!;

    public virtual ICollection<Stall> Stalls { get; set; } = new List<Stall>();
}
