using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<bool> IsActiveStaffAsync(int userId, CancellationToken ct = default);
        Task<IEnumerable<User>> GetUsersWithRolesAsync(string? roleName, string? search, bool limitToManageableRoles = false, CancellationToken ct = default);
        Task<IReadOnlyList<User>> GetActiveManagersByMarketAsync(int marketId, CancellationToken ct = default);
        Task<IReadOnlyList<User>> GetActiveUsersByRoleAsync(string? roleName, CancellationToken ct = default);
        Task<User?> GetUserByIdWithRoleAsync(int id, CancellationToken ct = default);
        Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default);
        /// <summary>
        /// Tìm người dùng theo email
        /// </summary>
        Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default);
    }
}
