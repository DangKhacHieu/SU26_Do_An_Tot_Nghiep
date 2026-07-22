using STMM.Business.DTOs.User;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IUserService
    {
        Task<IEnumerable<UserDto>> GetUsersAsync(string? roleName, string? search, int? currentUserId = null, CancellationToken ct = default);
        Task<UserDetailDto> GetUserByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default);
        Task<UserDto> RegisterUserAsync(CreateUserRequest request, int? creatorUserId = null, CancellationToken ct = default);
        Task<UserDto> UpdateUserAsync(int id, UpdateUserRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<UserDto> UpdateProfileAsync(int userId, EditProfileRequest request, CancellationToken ct = default);
        Task<UserDto> LockUnlockUserAsync(int id, string status, int? currentUserId = null, CancellationToken ct = default);
        Task<bool> DeleteUserAsync(int id, int? currentUserId = null, CancellationToken ct = default);
        Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken ct = default);
        Task<IEnumerable<UserDto>> GetAdminUsersAsync(string? roleName, string? search, CancellationToken ct = default);
        Task<IEnumerable<RoleDto>> GetAdminRolesAsync(CancellationToken ct = default);
        Task<UserDto> ResetPasswordAsync(int id, string newPassword, int? currentUserId = null, CancellationToken ct = default);
        Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
    }
}
