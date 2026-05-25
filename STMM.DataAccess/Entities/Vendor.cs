using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Vendor
{
    public int VendorId { get; set; }

    public int UserId { get; set; }

    public string BusinessName { get; set; } = null!;

    public string? TaxCode { get; set; }

    public string? BusinessLicense { get; set; }

    public string? Address { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual User User { get; set; } = null!;
}
