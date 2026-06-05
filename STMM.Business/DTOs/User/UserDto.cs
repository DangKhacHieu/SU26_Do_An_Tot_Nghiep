namespace STMM.Business.DTOs.User
{
    public class UserDto
    {
        /// <summary>
        /// Mã người dùng
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// Họ và tên
        /// </summary>
        public string Name { get; set; } = null!;

        /// <summary>
        /// Email
        /// </summary>
        public string Email { get; set; } = null!;

        /// <summary>
        /// Số điện thoại
        /// </summary>
        public string Phone { get; set; } = null!;

        /// <summary>
        /// Tên role
        /// </summary>
        public string RoleName { get; set; } = null!;

        /// <summary>
        /// ID Role
        /// </summary>
        public int RoleId { get; set; }

        /// <summary>
        /// Trạng thái tài khoản
        /// </summary>
        public string? Status { get; set; }
    }
}
