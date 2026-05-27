using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Vendor
{
    /// <summary>
    /// Mã tiểu thương
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Quan hệ 1-1 với tài khoản đăng nhập
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Tên cơ sở kinh doanh
    /// </summary>
    public string BusinessName { get; set; } = null!;

    /// <summary>
    /// Mã số thuế doanh nghiệp
    /// </summary>
    public string? TaxCode { get; set; }

    /// <summary>
    /// Link giấy phép kinh doanh scan
    /// </summary>
    public string? BusinessLicense { get; set; }

    /// <summary>
    /// Địa chỉ kinh doanh
    /// </summary>
    public string? Address { get; set; }

    /// <summary>
    /// Ngày khởi tạo hồ sơ
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

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual ICollection<ServiceRegistration> ServiceRegistrations { get; set; } = new List<ServiceRegistration>();

    public virtual User User { get; set; } = null!;
}
