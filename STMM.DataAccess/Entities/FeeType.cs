using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class FeeType
{
    /// <summary>
    /// Mã loại phí
    /// </summary>
    public int FeeTypeId { get; set; }

    /// <summary>
    /// Tên loại phí (Thuê sạp, Điện, Nước, Phạt...)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Đơn vị tính (kWh, m³, tháng)
    /// </summary>
    public string? Unit { get; set; }

    /// <summary>
    /// Mô tả chi tiết loại phí
    /// </summary>
    public string? Description { get; set; }

    public virtual ICollection<InvoiceDetail> InvoiceDetails { get; set; } = new List<InvoiceDetail>();

    public virtual ICollection<Service> Services { get; set; } = new List<Service>();
}
