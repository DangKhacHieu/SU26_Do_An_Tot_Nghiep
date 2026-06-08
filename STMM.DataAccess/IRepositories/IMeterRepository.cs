using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IMeterRepository : IBaseRepository<Meter>
    {
        Task<IEnumerable<Meter>> GetMetersByStallIdAsync(int stallId, CancellationToken ct = default);
        Task<Meter?> GetMeterWithStallAsync(int meterId, CancellationToken ct = default);
    }
}
