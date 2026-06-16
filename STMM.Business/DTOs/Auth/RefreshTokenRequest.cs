namespace STMM.Business.DTOs.Auth
{
    public class RefreshTokenRequest
    {
        /// <summary>
        /// Access Token cũ (để lấy UserId từ claims)
        /// </summary>
        public string AccessToken { get; set; } = null!;

        /// <summary>
        /// Refresh Token
        /// </summary>
        public string RefreshToken { get; set; } = null!;
    }
}