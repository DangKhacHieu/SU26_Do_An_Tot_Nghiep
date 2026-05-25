using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Stall
{
    public int StallId { get; set; }

    public string Code { get; set; } = null!;

    public int AreaId { get; set; }

    public string? Status { get; set; }

    public double? Size { get; set; }

    public double? MapX { get; set; }

    public double? MapY { get; set; }

    public double? Width { get; set; }

    public double? Height { get; set; }

    public double? Rotation { get; set; }

    public string? SvgPath { get; set; }

    public string? QrCode { get; set; }

    public DateOnly? FireInsuranceExpiry { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Meter> Meters { get; set; } = new List<Meter>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
