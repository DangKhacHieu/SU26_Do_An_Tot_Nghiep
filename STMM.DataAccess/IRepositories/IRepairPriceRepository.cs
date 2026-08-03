using STMM.DataAccess.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IRepairPriceRepository : IBaseRepository<RepairPrice>
    {
        new Task<IEnumerable<RepairPrice>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default);
        Task<IReadOnlyList<RepairPrice>> GetActiveForMarketAsync(int marketId, CancellationToken ct = default);
        Task<RepairPrice?> GetActiveByIdForMarketAsync(int repairPriceId, int marketId, CancellationToken ct = default);
        Task<bool> IsItemNameExistsAsync(string itemName, int? excludeId = null, int? marketId = null, CancellationToken ct = default);
    }
}
