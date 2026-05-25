using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Contract
{
    public int ContractId { get; set; }

    public int StallId { get; set; }

    public int VendorId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal RentFee { get; set; }

    public decimal Deposit { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<ContractFile> ContractFiles { get; set; } = new List<ContractFile>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual Stall Stall { get; set; } = null!;

    public virtual Vendor Vendor { get; set; } = null!;
}
