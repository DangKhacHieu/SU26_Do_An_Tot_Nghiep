using System;

namespace STMM.Business.DTOs.AuditLog
{
    public class AuditLogQueryParams
    {
        /// <summary>
        /// Tìm kiếm theo tên hoặc email người dùng
        /// </summary>
        public string? Search { get; set; }

        /// <summary>
        /// Bộ lọc hành động (từ khóa mô tả hành động)
        /// </summary>
        public string? Action { get; set; }

        /// <summary>
        /// Ngày bắt đầu lọc
        /// </summary>
        public DateTime? StartDate { get; set; }

        /// <summary>
        /// Ngày kết thúc lọc
        /// </summary>
        public DateTime? EndDate { get; set; }

        /// <summary>
        /// Số trang (mặc định = 1)
        /// </summary>
        public int PageNumber { get; set; } = 1;

        /// <summary>
        /// Số phần tử mỗi trang (mặc định = 20)
        /// </summary>
        public int PageSize { get; set; } = 20;
    }
}
