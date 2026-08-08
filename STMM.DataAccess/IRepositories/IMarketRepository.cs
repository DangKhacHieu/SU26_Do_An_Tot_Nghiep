using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IMarketRepository : IBaseRepository<Market>
    {
        Task<Market?> GetMarketMapAsync(int marketId, CancellationToken cancellationToken = default);
        Task<Market?> GetMarketWithStallContractsAsync(int marketId, CancellationToken ct = default);
        Task<int> CountUnpaidInvoicesAsync(int marketId, CancellationToken ct = default);
        Task<int> CountActiveServiceRegistrationsAsync(int marketId, CancellationToken ct = default);
        Task<System.Collections.Generic.List<int>> DetachAllUsersFromMarketAsync(int marketId, CancellationToken ct = default);
        Task DeactivateAllMetersAsync(int marketId, CancellationToken ct = default);
    }
}

