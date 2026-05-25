using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Meter
{
    public int MeterId { get; set; }

    public int StallId { get; set; }

    public string Type { get; set; } = null!;

    public string SerialNumber { get; set; } = null!;

    public DateOnly? InstalledAt { get; set; }

    public bool? IsActive { get; set; }

    public virtual ICollection<MeterReading> MeterReadings { get; set; } = new List<MeterReading>();

    public virtual Stall Stall { get; set; } = null!;
}
