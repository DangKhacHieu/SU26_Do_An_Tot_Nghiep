using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Payment
{
    public int Id { get; set; }

    public int InvoiceId { get; set; }

    public decimal Amount { get; set; }

    public string Method { get; set; } = null!;

    public string? TransactionCode { get; set; }

    public DateTime? PaidAt { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;
}
