using STMM.Business.DTOs.Auth;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    }
}
