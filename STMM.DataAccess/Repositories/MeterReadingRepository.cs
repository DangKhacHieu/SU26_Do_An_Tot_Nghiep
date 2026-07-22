using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class MeterReadingRepository : BaseRepository<MeterReading>, IMeterReadingRepository
    {
        public MeterReadingRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(IEnumerable<MeterReading> Items, int TotalCount)> GetReadingsByStallIdPagedAsync(
            int stallId, int marketId, string? meterType, int pageNumber, int pageSize, CancellationToken ct = default)
        {
            var sixMonthsAgo = DateOnly.FromDateTime(DateTime.UtcNow.AddMonths(-6));

            var query = _context.MeterReadings
                .Include(r => r.Meter).ThenInclude(m => m.Stall)
                .Include(r => r.CreatedByUser)
                .Where(r =>
                    r.Meter.StallId == stallId &&
                    r.Meter.Stall != null &&
                    r.Meter.Stall.Area.MarketId == marketId &&
                    r.RecordedAt >= sixMonthsAgo);

            if (!string.IsNullOrWhiteSpace(meterType))
            {
                query = query.Where(r => r.Meter.Type == meterType);
            }

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .OrderByDescending(r => r.RecordedAt)
                .ThenByDescending(r => r.MeterReadingId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<MeterReading?> GetLatestReadingByMeterIdAsync(int meterId, CancellationToken ct = default)
        {
            return await _context.MeterReadings
                .Where(r => r.MeterId == meterId)
                .OrderByDescending(r => r.RecordedAt)
                .ThenByDescending(r => r.MeterReadingId)
                .AsNoTracking()
                .FirstOrDefaultAsync(ct);
        }

        public async Task<bool> ExistsByMeterAndDateAsync(int meterId, DateOnly recordedAt, CancellationToken ct = default)
        {
            return await _context.MeterReadings
                .AnyAsync(r => r.MeterId == meterId && r.RecordedAt == recordedAt, ct);
        }

        public async Task<MeterReading?> GetMeterReadingByMonthAndYearAsync(int meterId, int month, int year, CancellationToken ct = default)
        {
            return await _context.MeterReadings
                .Where(mr => mr.MeterId == meterId && 
                             mr.RecordedAt.Month == month && 
                             mr.RecordedAt.Year == year)
                .FirstOrDefaultAsync(ct);
        }
    }
}
