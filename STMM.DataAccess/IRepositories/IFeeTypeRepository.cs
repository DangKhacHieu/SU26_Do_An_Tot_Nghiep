using STMM.DataAccess.Entities;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IFeeTypeRepository : IBaseRepository<FeeType>
    {
        new Task<IEnumerable<FeeType>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default);
        Task<bool> IsNameExistsAsync(string name, int? excludeId = null, int? marketId = null, CancellationToken ct = default);
        Task<FeeType?> GetFeeTypeByNameAsync(string name, int? marketId = null, CancellationToken ct = default);
        Task<FeeType?> GetFeeTypeByNameContainsAsync(string keyword, int? marketId = null, CancellationToken ct = default);
        Task<FeeType?> GetRentFeeTypeAsync(int? marketId = null, CancellationToken ct = default);
    }
}
