using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Service
{
    /// <summary>
    /// Mã định danh dịch vụ
    /// </summary>
    public int ServiceId { get; set; }

    /// <summary>
    /// Tên dịch vụ (VD: Vệ sinh, Wifi)
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết quyền lợi
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Đơn giá dịch vụ (VNĐ)
    /// </summary>
    public decimal Price { get; set; }

    /// <summary>
    /// Chu kỳ tính phí (One-time, Monthly, Yearly)
    /// </summary>
    public string? BillingCycle { get; set; }

    /// <summary>
    /// Liên kết với bảng fee_types để tự động xuất hóa đơn
    /// </summary>
    public int FeeTypeId { get; set; }

    /// <summary>
    /// Admin/Manager nào là người tạo dịch vụ này
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Trạng thái dịch vụ
    /// </summary>
    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;

    public virtual FeeType FeeType { get; set; } = null!;

    public virtual ICollection<ServiceRegistration> ServiceRegistrations { get; set; } = new List<ServiceRegistration>();
}
