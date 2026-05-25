using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Invoice
{
    public int InvoiceId { get; set; }

    public int ContractId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalAmount { get; set; }

    public string? Status { get; set; }

    public DateOnly? DueDate { get; set; }

    public int? AdjustedFromId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool? IsDeleted { get; set; }

    public DateTime? DeletedAt { get; set; }

    public virtual Invoice? AdjustedFrom { get; set; }

    public virtual Contract Contract { get; set; } = null!;

    public virtual ICollection<Invoice> InverseAdjustedFrom { get; set; } = new List<Invoice>();

    public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();

    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();
}
