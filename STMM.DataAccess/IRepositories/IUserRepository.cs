using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IUserRepository : IBaseRepository<User>
    {
        Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default);
    }
}
