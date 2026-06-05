using STMM.Business.DTOs.Auth;

namespace STMM.Business.Interfaces
{
    public interface IAuthService
    {
        Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
        Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
        Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default);
    }
}