namespace STMM.Business.DTOs.Auth
{
    public class LoginRequest
    {
        /// <summary>
        /// Email người dùng
        /// </summary>
        public string Email { get; set; } = null!;

        /// <summary>
        /// Mật khẩu
        /// </summary>
        public string Password { get; set; } = null!;
    }
}