using STMM.Business.DTOs.User;

namespace STMM.Business.DTOs.Auth
{
    public class LoginResponse
    {
        /// <summary>
        /// JWT Access Token (15-30 phút)
        /// </summary>
        public string AccessToken { get; set; } = null!;

        /// <summary>
        /// JWT Refresh Token (7 ngày)
        /// </summary>
        public string RefreshToken { get; set; } = null!;

        /// <summary>
        /// Thông tin người dùng
        /// </summary>
        public UserDto User { get; set; } = null!;

        /// <summary>
        /// Đường dẫn mặc định sau khi đăng nhập theo role
        /// </summary>
        public string RedirectUrl { get; set; } = "/";
    }
}