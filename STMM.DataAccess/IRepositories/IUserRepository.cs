using STMM.DataAccess.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<bool> IsActiveStaffAsync(int userId, CancellationToken ct = default);
    }
}
