using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IMeterRepository : IBaseRepository<Meter>
    {
        Task<IEnumerable<Meter>> GetMetersByStallIdAsync(int stallId, CancellationToken ct = default);
        Task<IEnumerable<Meter>> GetMetersByStallForMarketAsync(int stallId, int marketId, CancellationToken ct = default);
        Task<Meter?> GetMeterWithStallAsync(int meterId, CancellationToken ct = default);
        Task<Meter?> GetMeterWithStallForMarketAsync(int meterId, int marketId, CancellationToken ct = default);
        Task<Meter?> GetMeterForMarketAsync(int meterId, int marketId, CancellationToken ct = default);
        Task<Meter?> GetMeterForUpdateInMarketAsync(int meterId, int marketId, CancellationToken ct = default);
        Task<(IEnumerable<Meter> Items, int TotalCount)> GetMetersPagedAsync(string? type, bool? isActive, bool? isAssigned, string? search, int pageNumber, int pageSize, int? marketId = null, CancellationToken ct = default);
        Task<bool> ExistsSerialNumberAsync(string serialNumber, int? excludeMeterId = null, CancellationToken ct = default);
        Task<IEnumerable<Meter>> GetUnassignedMetersAsync(string? type, int? marketId = null, CancellationToken ct = default);
    }
}
