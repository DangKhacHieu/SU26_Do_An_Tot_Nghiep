using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IViolationTypeRepository : IBaseRepository<ViolationType>
    {
        new Task<IEnumerable<ViolationType>> GetAllAsync(int? marketId = null, CancellationToken cancellationToken = default);
        Task<bool> IsNameExistsAsync(string name, int? excludeId = null, int? marketId = null, CancellationToken ct = default);
    }
}
