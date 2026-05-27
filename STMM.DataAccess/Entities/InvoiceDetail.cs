using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class InvoiceDetail
{
    /// <summary>
    /// Mã bản ghi chi tiết hóa đơn
    /// </summary>
    public int InvoiceDetailId { get; set; }

    /// <summary>
    /// Thuộc hóa đơn nào
    /// </summary>
    public int InvoiceId { get; set; }

    /// <summary>
    /// Loại phí áp dụng
    /// </summary>
    public int FeeTypeId { get; set; }

    /// <summary>
    /// Mô tả chi tiết khoản phí
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Số lượng tiêu thụ
    /// </summary>
    public double Quantity { get; set; }

    /// <summary>
    /// Đơn giá
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Thành tiền
    /// </summary>
    public decimal Amount { get; set; }

    public virtual FeeType FeeType { get; set; } = null!;

    public virtual Invoice Invoice { get; set; } = null!;
}
