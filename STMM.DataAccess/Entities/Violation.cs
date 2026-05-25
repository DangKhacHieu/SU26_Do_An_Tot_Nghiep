using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Violation
{
    public int ViolationId { get; set; }

    public int StallId { get; set; }

    public int CreatedBy { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string ImageUrl { get; set; } = null!;

    public decimal? FineAmount { get; set; }

    public string? Status { get; set; }

    public DateTime? NotifiedAt { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByNavigation { get; set; } = null!;

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual Stall Stall { get; set; } = null!;
}
