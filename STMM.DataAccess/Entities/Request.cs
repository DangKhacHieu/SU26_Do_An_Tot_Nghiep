using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Yêu cầu từ tiểu thương
/// </summary>
public partial class Request
{
    /// <summary>
    /// Mã yêu cầu
    /// </summary>
    public int RequestId { get; set; }

    /// <summary>
    /// Tiểu thương gửi yêu cầu
    /// </summary>
    public int VendorId { get; set; }

    /// <summary>
    /// Yêu cầu liên quan tới sạp nào
    /// </summary>
    public int StallId { get; set; }

    /// <summary>
    /// FacilityIssue, ViolationAppeal, InvoiceDispute
    /// </summary>
    public string RequestType { get; set; } = null!;

    /// <summary>
    /// Điền nếu Kháng nghị vi phạm
    /// </summary>
    public int? ViolationId { get; set; }

    /// <summary>
    /// Điền nếu Kháng nghị hóa đơn
    /// </summary>
    public int? InvoiceId { get; set; }

    /// <summary>
    /// Tiêu đề yêu cầu
    /// </summary>
    public string Title { get; set; } = null!;

    /// <summary>
    /// Mô tả chi tiết
    /// </summary>
    public string Description { get; set; } = null!;

    /// <summary>
    /// Hình ảnh minh chứng đính kèm
    /// </summary>
    public string? ImageUrl { get; set; }

    /// <summary>
    /// Vòng đời: Pending → Quoted → Approved → Completed | Rejected
    /// </summary>
    public string? Status { get; set; }

    /// <summary>
    /// Bảng kê chi tiết báo giá vật tư dạng văn bản — sinh tự động từ danh sách task_materials
    /// </summary>
    public string? QuotationText { get; set; }

    /// <summary>
    /// Tổng chi phí báo giá dự kiến (VNĐ)
    /// </summary>
    public decimal? QuotationAmount { get; set; }

    /// <summary>
    /// Kết quả duyệt báo giá: null=Chờ duyệt | true=Đã duyệt | false=Từ chối
    /// </summary>
    public bool? IsQuoteApproved { get; set; }

    /// <summary>
    /// Đối tượng chi trả: Vendor=Tiểu thương chịu | Market=Chợ chịu. Quyết định ai duyệt báo giá khi status=Quoted
    /// </summary>
    public string? PaidBy { get; set; }

    /// <summary>
    /// Lý do Vendor từ chối báo giá gần nhất.
    /// </summary>
    public string? VendorRejectReason { get; set; }

    /// <summary>
    /// Ghi chú cho quyết định xử lý báo giá gần nhất của Manager.
    /// </summary>
    public string? PayerDecisionNote { get; set; }

    /// <summary>
    /// Điều khoản hợp đồng được Manager dùng để xác định bên chịu phí.
    /// </summary>
    public string? PayerContractClause { get; set; }

    /// <summary>
    /// Đánh giá chất lượng sửa chữa của Vendor (1–5 sao)
    /// </summary>
    public int? RepairRating { get; set; }

    /// <summary>
    /// Bình luận nhận xét của Vendor sau khi sửa chữa hoàn thành
    /// </summary>
    public string? RepairComment { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Invoice? Invoice { get; set; }

    public virtual Stall Stall { get; set; } = null!;

    public virtual ICollection<StaffTask> StaffTasks { get; set; } = new List<StaffTask>();

    public virtual Vendor Vendor { get; set; } = null!;

    public virtual Violation? Violation { get; set; }
}
