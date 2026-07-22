using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IMeterReadingRepository : IBaseRepository<MeterReading>
    {
        Task<(IEnumerable<MeterReading> Items, int TotalCount)> GetReadingsByStallIdPagedAsync(
            int stallId, int marketId, string? meterType, int pageNumber, int pageSize, CancellationToken ct = default);

        Task<MeterReading?> GetLatestReadingByMeterIdAsync(int meterId, CancellationToken ct = default);

        Task<bool> ExistsByMeterAndDateAsync(int meterId, DateOnly recordedAt, CancellationToken ct = default);
        Task<MeterReading?> GetMeterReadingByMonthAndYearAsync(int meterId, int month, int year, CancellationToken ct = default);
    }
}
