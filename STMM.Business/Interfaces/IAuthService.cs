using STMM.Business.DTOs.Auth;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
        Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
        Task<LoginResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken ct = default);
        Task ResendVerificationCodeAsync(ResendVerificationRequest request, CancellationToken ct = default);
        Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
        Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken ct = default);
        Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
        Task<LoginResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken ct = default);
    }
}