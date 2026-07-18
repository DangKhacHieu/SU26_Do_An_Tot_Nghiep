using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Profile;

namespace STMM.Business.Interfaces
{
    public interface IUserProfileService
    {
        Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default);
        
        Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default);
        
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
    }
}
