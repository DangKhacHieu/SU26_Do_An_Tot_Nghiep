using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Stall
{
    /// <summary>
    /// Mã định danh quầy sạp
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// Số hiệu sạp vật lý (VD: A-102)
    /// </summary>
    public string Code { get; set; } = null!;

    /// <summary>
    /// Thuộc khu vực phân khu nào trong chợ
    /// </summary>
    public int AreaId { get; set; }

    /// <summary>
    /// Phân loại ngành hàng kinh doanh
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Tình trạng sạp (Available, Rented, Maintenance)
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Diện tích mặt bằng sạp (m²)
    /// </summary>
    public double? Size { get; set; }

    /// <summary>
    /// Tọa độ điểm neo trên Floor Map
    /// </summary>
    public double? MapX { get; set; }

    /// <summary>
    /// Tọa độ điểm neo trên Floor Map
    /// </summary>
    public double? MapY { get; set; }

    /// <summary>
    /// Kích thước hiển thị sạp trên Web UI
    /// </summary>
    public double? Width { get; set; }

    /// <summary>
    /// Kích thước hiển thị sạp trên Web UI
    /// </summary>
    public double? Height { get; set; }

    /// <summary>
    /// Góc xoay hiển thị sạp trên Floor Map
    /// </summary>
    public double? Rotation { get; set; }

    /// <summary>
    /// Chuỗi dữ liệu vẽ vector hình dạng sạp tự do
    /// </summary>
    public string? SvgPath { get; set; }

    /// <summary>
    /// Ngày hết hạn bảo hiểm hỏa hoạn bắt buộc
    /// </summary>
    public DateOnly? FireInsuranceExpiry { get; set; }

    /// <summary>
    /// Ngày khởi tạo
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

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<Contract> Contracts { get; set; } = new List<Contract>();

    public virtual ICollection<Issue> Issues { get; set; } = new List<Issue>();

    public virtual ICollection<Meter> Meters { get; set; } = new List<Meter>();

    public virtual ICollection<Request> Requests { get; set; } = new List<Request>();

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<ServiceRegistration> ServiceRegistrations { get; set; } = new List<ServiceRegistration>();

    public virtual ICollection<Violation> Violations { get; set; } = new List<Violation>();
}
