using System;

namespace STMM.Business.DTOs.AuditLog
{
    public class AuditLogDto
    {
        /// <summary>
        /// Mã bản ghi nhật ký
        /// </summary>
        public int LogId { get; set; }

        /// <summary>
        /// Người dùng thực hiện hành động
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Mô tả hành động (VD: "Tạo hóa đơn", "Xóa sạp")
        /// </summary>
        public string Action { get; set; } = null!;

        /// <summary>
        /// Địa chỉ IP của thiết bị thực hiện
        /// </summary>
        public string? IpAddress { get; set; }

        /// <summary>
        /// Thời điểm ghi nhận
        /// </summary>
        public DateTime? CreatedAt { get; set; }

        /// <summary>
        /// Tên người thực hiện
        /// </summary>
        public string UserName { get; set; } = string.Empty;

        /// <summary>
        /// Email người thực hiện
        /// </summary>
        public string UserEmail { get; set; } = string.Empty;

        /// <summary>
        /// Vai trò người thực hiện
        /// </summary>
        public string RoleName { get; set; } = string.Empty;
    }
}
