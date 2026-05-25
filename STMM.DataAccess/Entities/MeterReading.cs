using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class MeterReading
{
    public int Id { get; set; }

    public int MeterId { get; set; }

    public double OldValue { get; set; }

    public double NewValue { get; set; }

    public DateOnly RecordedAt { get; set; }

    public int CreatedBy { get; set; }

    public string ImageUrl { get; set; } = null!;

    public bool? IsSynced { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual Meter Meter { get; set; } = null!;
}
