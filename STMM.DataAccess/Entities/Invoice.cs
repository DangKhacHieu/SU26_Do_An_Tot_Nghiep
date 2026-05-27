using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Invoice
{
    /// <summary>
    /// Mã định danh hóa đơn
    /// </summary>
    public int InvoiceId { get; set; }

    /// <summary>
    /// Hóa đơn tính cho hợp đồng nào
    /// </summary>
    public int ContractId { get; set; }

    /// <summary>
    /// Tháng tính hóa đơn
    /// </summary>
    public int Month { get; set; }

    /// <summary>
    /// Năm tính hóa đơn
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Tổng số tiền phải nộp (VNĐ)
    /// </summary>
    public decimal TotalAmount { get; set; }

    /// <summary>
    /// Trạng thái (Unpaid, Paid, Adjusted)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Hạn chót thanh toán
    /// </summary>
    public DateOnly? DueDate { get; set; }

    /// <summary>
    /// Trỏ về ID hóa đơn gốc bị lỗi (nếu có)
    /// </summary>
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
