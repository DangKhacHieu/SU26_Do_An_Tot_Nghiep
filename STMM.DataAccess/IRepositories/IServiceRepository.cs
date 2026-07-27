using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IServiceRepository : IBaseRepository<Service>
    {
        new Task<IEnumerable<Service>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default);
        Task<bool> IsFeeTypeInUseAsync(int feeTypeId, int? marketId = null, CancellationToken ct = default);
        Task<IEnumerable<Service>> GetServicesWithFeeTypeAsync(int? marketId = null, CancellationToken ct = default);
        Task<bool> IsNameExistsAsync(string name, int? excludeId = null, int? marketId = null, CancellationToken ct = default);
        Task<Service?> GetServiceWithFeeTypeByIdAsync(int id, int? marketId = null, CancellationToken ct = default);
    }
}
