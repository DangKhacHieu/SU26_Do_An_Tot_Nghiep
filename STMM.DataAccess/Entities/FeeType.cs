using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class FeeType
{
    public int Id { get; set; }

    public string Name { get; set; } = null!;

    public string? Unit { get; set; }

    public string? Description { get; set; }

    public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();
}
