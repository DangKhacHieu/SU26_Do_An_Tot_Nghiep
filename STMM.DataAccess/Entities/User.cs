using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class User
{
    /// <summary>
    /// Mã định danh người dùng
    /// </summary>
    public int UserId { get; set; }

    /// <summary>
    /// Liên kết tới bảng roles
    /// </summary>
    public int RoleId { get; set; }

    /// <summary>
    /// Họ và tên đầy đủ
    /// </summary>
    public string Name { get; set; } = null!;

    /// <summary>
    /// Email đăng nhập và nhận thông báo tài chính
    /// </summary>
    public string Email { get; set; } = null!;

    /// <summary>
    /// Mật khẩu băm (BCrypt / Argon2)
    /// </summary>
    public string Password { get; set; } = null!;

    /// <summary>
    /// Số điện thoại liên lạc
    /// </summary>
    public string Phone { get; set; } = null!;

    /// <summary>
    /// Số Căn cước công dân phục vụ làm hợp đồng
    /// </summary>
    public string Cccd { get; set; } = null!;

    /// <summary>
    /// Trạng thái tài khoản (Active, Suspended, Locked)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Mã OTP xác minh quên mật khẩu/đổi số điện thoại
    /// </summary>
    public string? OtpCode { get; set; }

    /// <summary>
    /// Thời gian hết hạn của mã OTP
    /// </summary>
    public DateTime? OtpExpiredAt { get; set; }

    /// <summary>
    /// Ghi nhận thời gian đăng nhập gần nhất
    /// </summary>
    public DateTime? LastLogin { get; set; }

    /// <summary>
    /// Ngày giờ khởi tạo tài khoản
    /// </summary>
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Ngày giờ cập nhật gần nhất
    /// </summary>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Đánh dấu xóa mềm tài khoản
    /// </summary>
    public bool? IsDeleted { get; set; }

    /// <summary>
    /// Thời điểm thực hiện xóa mềm
    /// </summary>
    public DateTime? DeletedAt { get; set; }

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Faq> Faqs { get; set; } = new List<Faq>();

    public virtual ICollection<Issue> Issues { get; set; } = new List<Issue>();

    public virtual ICollection<MeterReading> MeterReadings { get; set; } = new List<MeterReading>();

    public virtual ICollection<Notification> NotificationCreatedByUsers { get; set; } = new List<Notification>();

    public virtual ICollection<Notification> NotificationTargetUsers { get; set; } = new List<Notification>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual Role Role { get; set; } = null!;

    public virtual ICollection<Service> Services { get; set; } = new List<Service>();

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();

    public virtual ICollection<SystemConfig> SystemConfigs { get; set; } = new List<SystemConfig>();

    public virtual Vendor? Vendor { get; set; }

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
