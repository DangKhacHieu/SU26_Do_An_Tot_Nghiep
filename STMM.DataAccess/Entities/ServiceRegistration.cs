using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Đăng ký sử dụng dịch vụ
/// </summary>
public partial class ServiceRegistration
{
    /// <summary>
    /// Mã đăng ký dịch vụ
    /// </summary>
    public int RegistrationId { get; set; }

    /// <summary>
    /// Đăng ký dịch vụ nào
    /// </summary>
    public int ServiceId { get; set; }

    /// <summary>
    /// Tiểu thương nào đăng ký
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Sạp nào thụ hưởng dịch vụ
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Trạng thái (Pending, Active, Cancelled)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Thời điểm đăng ký
    /// </summary>
    public DateTime? RegisteredAt { get; set; }

    /// <summary>
    /// Thời điểm hủy dịch vụ
    /// </summary>
    public DateTime? CancelledAt { get; set; }

    /// <summary>
    /// Thời điểm kết thúc chu kỳ tính phí hiện tại (nếu có)
    /// </summary>
    public DateTime? EndDate { get; set; }

    /// <summary>
    /// Cờ tự động gia hạn (Mặc định là true cho các dịch vụ theo chu kỳ)
    /// </summary>
    public bool IsAutoRenew { get; set; }

    public virtual Service Service { get; set; } = null!;

    public virtual Stall Stall { get; set; } = null!;

    public virtual Vendor Vendor { get; set; } = null!;
}
