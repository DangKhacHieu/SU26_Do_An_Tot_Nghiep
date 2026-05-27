using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Contract
{
    /// <summary>
    /// Mã hợp đồng
    /// </summary>
    public int ContractId { get; set; }

    /// <summary>
    /// Hợp đồng thuê sạp nào
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Tiểu thương ký hợp đồng
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Ngày bắt đầu hợp đồng
    /// </summary>
    public DateOnly StartDate { get; set; }

    /// <summary>
    /// Ngày kết thúc hợp đồng
    /// </summary>
    public DateOnly EndDate { get; set; }

    /// <summary>
    /// Giá thuê hàng tháng (VNĐ)
    /// </summary>
    public decimal RentFee { get; set; }

    /// <summary>
    /// Tiền đặt cọc (VNĐ)
    /// </summary>
    public decimal Deposit { get; set; }

    /// <summary>
    /// Trạng thái (Active, Expired, Terminated)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Ngày tạo hợp đồng
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Đánh dấu xóa mềm
    /// </summary>
    public bool? IsDeleted { get; set; }

    /// <summary>
    /// Thời điểm xóa mềm
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<ContractFile> ContractFiles { get; set; } = new List<ContractFile>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual Stall Stall { get; set; } = null!;

    public virtual Vendor Vendor { get; set; } = null!;
}
