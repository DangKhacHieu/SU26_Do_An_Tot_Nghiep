using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<IEnumerable<User>> GetUsersWithRolesAsync(string? roleName, string? search, CancellationToken ct = default);
        Task<User?> GetUserByIdWithRoleAsync(int id, CancellationToken ct = default);
    }
}

