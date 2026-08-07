using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IMarketRepository : IBaseRepository<Market>
    {
        Task<Market?> GetMarketMapAsync(int marketId, CancellationToken cancellationToken = default);
    }
}

