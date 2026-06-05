using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;

namespace STMM.Business.Interfaces
{
    public interface IUserService
    {
        Task<UserDto> UpdateProfileAsync(int userId, EditProfileRequest request, CancellationToken ct = default);
    }
}
