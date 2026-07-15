using System;

namespace STMM.Business.DTOs.User
{
    public class UserDto
    {
        /// <summary>
        /// Mã người dùng
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// ID Role
        /// </summary>
        public int RoleId { get; set; }

        /// <summary>
        /// Tên role
        /// </summary>
        public string RoleName { get; set; } = string.Empty;

        /// <summary>
        /// Họ và tên
        /// </summary>
        public string Name { get; set; } = string.Empty;

        /// <summary>
        /// Email
        /// </summary>
        public string Email { get; set; } = string.Empty;

        /// <summary>
        /// Số điện thoại
        /// </summary>
        public string Phone { get; set; } = string.Empty;

        /// <summary>
        /// CCCD
        /// </summary>
        public string Cccd { get; set; } = string.Empty;

        /// <summary>
        /// Trạng thái tài khoản
        /// </summary>
        public string Status { get; set; } = string.Empty;

        /// <summary>
        /// Đăng nhập lần cuối
        /// </summary>
        public DateTime? LastLogin { get; set; }

        /// <summary>
        /// Ngày tạo
        /// </summary>
        public DateTime? CreatedAt { get; set; }

        /// <summary>
        /// ID chợ được gán cho người dùng
        /// </summary>
        public int? MarketId { get; set; }
    }
}
