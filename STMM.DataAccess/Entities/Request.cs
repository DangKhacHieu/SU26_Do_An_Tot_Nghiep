using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Request
{
    public int RequestId { get; set; }

    public int VendorId { get; set; }

    public int StallId { get; set; }

    public string RequestType { get; set; } = null!;

    public int? ViolationId { get; set; }

    public int? InvoiceId { get; set; }

    public string Title { get; set; } = null!;

    public string Description { get; set; } = null!;

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Invoice? Invoice { get; set; }

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();

    public virtual Stall Stall { get; set; } = null!;

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual Violation? Violation { get; set; }
}
