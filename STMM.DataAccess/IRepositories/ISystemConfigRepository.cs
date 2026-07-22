using STMM.DataAccess.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface ISystemConfigRepository : IBaseRepository<SystemConfig>
    {
        new Task<IEnumerable<SystemConfig>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default);
        Task<SystemConfig?> GetSystemConfigByKeyAsync(string key, int? marketId = null, CancellationToken ct = default);
    }
}
