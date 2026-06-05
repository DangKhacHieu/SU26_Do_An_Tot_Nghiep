using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<IEnumerable<User>> GetUsersWithRolesAsync(string? roleName, string? search, bool limitToManageableRoles = false, CancellationToken ct = default);
        Task<User?> GetUserByIdWithRoleAsync(int id, CancellationToken ct = default);
        Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default);
    }
}
