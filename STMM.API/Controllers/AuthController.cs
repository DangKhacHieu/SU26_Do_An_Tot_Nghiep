using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using STMM.Business.DTOs.Auth;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        private readonly IAuditLogService _auditLogService;

        public AuthController(IAuthService authService, IAuditLogService auditLogService)
        {
            _authService = authService;
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Đăng nhập người dùng
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login(
            [FromBody] LoginRequest request,
            CancellationToken ct)
        {
            var result = await _authService.LoginAsync(request, ct);

            // Ghi nhật ký đăng nhập thành công
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(result.User.UserId, $"Đăng nhập thành công ({result.User.RoleName})", ipAddress, ct);

            return Ok(result);
        }

        /// <summary>
        /// Làm mới Access Token
        /// </summary>
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshToken(
            [FromBody] RefreshTokenRequest request,
            CancellationToken ct)
        {
            var result = await _authService.RefreshTokenAsync(request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Đăng ký người dùng
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register(
            [FromBody] RegisterRequest request,
            CancellationToken ct)
        {
            var result = await _authService.RegisterAsync(request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Xác thực email người dùng mới bằng mã OTP
        /// </summary>
        [HttpPost("verify-email")]
        public async Task<IActionResult> VerifyEmail(
            [FromBody] VerifyEmailRequest request,
            CancellationToken ct)
        {
            var result = await _authService.VerifyEmailAsync(request, ct);

            // Ghi nhật ký khi người dùng hoàn thành OTP và kích hoạt tài khoản
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(result.User.UserId, $"Xác thực email OTP thành công - Kích hoạt tài khoản ({result.User.RoleName})", ipAddress, ct);

            return Ok(result);
        }

        /// <summary>
        /// Gửi lại mã OTP xác thực email
        /// </summary>
        [HttpPost("resend-verification")]
        public async Task<IActionResult> ResendVerification(
            [FromBody] ResendVerificationRequest request,
            CancellationToken ct)
        {
            await _authService.ResendVerificationCodeAsync(request, ct);
            return Ok(new { message = "Mã xác thực mới đã được gửi tới email của bạn." });
        }

        /// <summary>
        /// Yêu cầu khôi phục mật khẩu (gửi mã OTP)
        /// </summary>
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(
            [FromBody] ForgotPasswordRequest request,
            CancellationToken ct)
        {
            await _authService.ForgotPasswordAsync(request, ct);
            return Ok(new { message = "Mã OTP khôi phục mật khẩu đã được gửi tới email của bạn." });
        }

        /// <summary>
        /// Xác thực mã OTP khôi phục mật khẩu trước khi đổi mật khẩu
        /// </summary>
        [HttpPost("verify-reset-otp")]
        public async Task<IActionResult> VerifyResetOtp(
            [FromBody] VerifyResetOtpRequest request,
            CancellationToken ct)
        {
            await _authService.VerifyResetOtpAsync(request, ct);
            return Ok(new { message = "Mã OTP hợp lệ." });
        }

        /// <summary>
        /// Xác thực OTP và đặt lại mật khẩu mới
        /// </summary>
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(
            [FromBody] STMM.Business.DTOs.Auth.ResetPasswordRequest request,
            CancellationToken ct)
        {
            await _authService.ResetPasswordAsync(request, ct);
            return Ok(new { message = "Khôi phục mật khẩu thành công. Vui lòng đăng nhập bằng mật khẩu mới." });
        }

        /// <summary>
        /// Đăng nhập / Đăng ký bằng Google
        /// </summary>
        [HttpPost("google")]
        public async Task<IActionResult> LoginWithGoogle(
            [FromBody] GoogleLoginRequest request,
            CancellationToken ct)
        {
            var result = await _authService.LoginWithGoogleAsync(request, ct);

            // Ghi nhật ký đăng nhập Google thành công
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(result.User.UserId, $"Đăng nhập thành công bằng Google ({result.User.RoleName})", ipAddress, ct);

            return Ok(result);
        }

        /// <summary>
        /// Đổi mật khẩu người dùng
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword(
            [FromBody] ChangePasswordRequest request,
            CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Unauthorized(new { message = "Không xác định được người dùng." });
            }

            await _authService.ChangePasswordAsync(userId, request, ct);

            // Ghi nhật ký đổi mật khẩu thành công
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, "Thay đổi mật khẩu tài khoản cá nhân", ipAddress, ct);

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
    }
}
