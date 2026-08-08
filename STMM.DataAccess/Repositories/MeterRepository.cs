using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class MeterRepository : BaseRepository<Meter>, IMeterRepository
    {
        public MeterRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Meter>> GetMetersByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.Stall)
                .Where(m => m.StallId == stallId && m.IsActive == true)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<Meter>> GetMetersByStallForMarketAsync(
            int stallId,
            int marketId,
            CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.Stall)
                    .ThenInclude(s => s!.Area)
                .Where(m =>
                    m.StallId == stallId &&
                    m.Stall != null &&
                    m.Stall.Area.MarketId == marketId &&
                    m.IsActive == true)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<Meter?> GetMeterWithStallAsync(int meterId, CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MeterId == meterId, ct);
        }

        public Task<Meter?> GetMeterWithStallForMarketAsync(
            int meterId,
            int marketId,
            CancellationToken ct = default)
        {
            return _context.Meters
                .Include(m => m.Stall)
                    .ThenInclude(s => s!.Area)
                .AsNoTracking()
                .FirstOrDefaultAsync(m =>
                    m.MeterId == meterId &&
                    m.Stall != null &&
                    m.Stall.Area.MarketId == marketId,
                    ct);
        }

        public Task<Meter?> GetEligibleMeterForReadingAsync(
            int meterId,
            int marketId,
            int staffUserId,
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            return _context.Meters
                .Include(m => m.Stall)
                    .ThenInclude(s => s!.Area)
                .Where(m =>
                    m.MeterId == meterId &&
                    m.MarketId == marketId &&
                    m.IsActive == true &&
                    m.Stall != null &&
                    m.Stall.IsDeleted != true &&
                    m.Stall.Area.MarketId == marketId &&
                    // Must match GetStallsChecklistByAreaAsync exactly: a reading recorded for a
                    // stall the checklist does not list would never reach an invoice.
                    m.Stall.Contracts.Any(c =>
                        c.IsDeleted != true &&
                        c.Status == "Active" &&
                        c.StartDate <= effectiveDate &&
                        c.EndDate >= effectiveDate) &&
                    _context.StaffTasks.Any(t =>
                        t.AssignedToUserId == staffUserId &&
                        t.TaskType == "UtilityReading" &&
                        t.Status != "Completed" &&
                        t.Status != "Cancelled" &&
                        t.AreaId == m.Stall.AreaId &&
                        (t.CreatedAt.HasValue && t.CreatedAt.Value.Year == effectiveDate.Year && t.CreatedAt.Value.Month == effectiveDate.Month)))
                .AsNoTracking()
                .FirstOrDefaultAsync(ct);
        }

        public Task<Meter?> GetMeterForMarketAsync(
            int meterId,
            int marketId,
            CancellationToken ct = default)
        {
            return _context.Meters
                .Include(m => m.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(m =>
                    m.MeterId == meterId &&
                    m.MarketId == marketId,
                    ct);
        }

        public Task<Meter?> GetMeterForUpdateInMarketAsync(
            int meterId,
            int marketId,
            CancellationToken ct = default)
        {
            return _context.Meters
                .Include(m => m.Stall)
                .FirstOrDefaultAsync(m =>
                    m.MeterId == meterId &&
                    m.MarketId == marketId,
                    ct);
        }

        public async Task<IReadOnlyList<Meter>> GetMetersForMarketAsync(
            int? marketId,
            CancellationToken ct = default)
        {
            if (marketId == null) return new List<Meter>();

            return await _context.Meters
                .Include(m => m.Stall)
                .Where(m => m.MarketId == marketId.Value)
                .OrderBy(m => m.MeterId)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<IReadOnlyList<(Meter Meter, MeterReading? LatestReading)>> GetMetersWithLatestReadingForMarketAsync(
            int? marketId,
            CancellationToken ct = default)
        {
            if (marketId == null) return new List<(Meter Meter, MeterReading? LatestReading)>();

            var results = await _context.Meters
                .Include(m => m.Stall)
                .Where(m => m.MarketId == marketId.Value)
                .OrderBy(m => m.MeterId)
                .Select(m => new
                {
                    Meter = m,
                    LatestReading = m.MeterReadings
                        .OrderByDescending(r => r.RecordedAt)
                        .ThenByDescending(r => r.MeterReadingId)
                        .FirstOrDefault()
                })
                .AsNoTracking()
                .ToListAsync(ct);

            return results.Select(x => (x.Meter, x.LatestReading)).ToList();
        }

        public async Task<IReadOnlyList<(Meter Meter, MeterReading? LatestReading)>> GetMetersWithLatestReadingByStallForMarketAsync(
            int stallId,
            int marketId,
            CancellationToken ct = default)
        {
            var results = await _context.Meters
                .Include(m => m.Stall)
                    .ThenInclude(s => s!.Area)
                .Where(m =>
                    m.StallId == stallId &&
                    m.Stall != null &&
                    m.Stall.Area.MarketId == marketId &&
                    m.IsActive == true)
                .OrderBy(m => m.MeterId)
                .Select(m => new
                {
                    Meter = m,
                    LatestReading = m.MeterReadings
                        .OrderByDescending(r => r.RecordedAt)
                        .ThenByDescending(r => r.MeterReadingId)
                        .FirstOrDefault()
                })
                .AsNoTracking()
                .ToListAsync(ct);

            return results.Select(x => (x.Meter, x.LatestReading)).ToList();
        }

        public async Task<(Meter Meter, MeterReading? LatestReading)?> GetMeterWithLatestReadingForMarketAsync(
            int meterId,
            int marketId,
            CancellationToken ct = default)
        {
            // F-03: lọc theo cột Meter.MarketId, thống nhất với GetMetersWithLatestReadingForMarketAsync
            // và GetUnassignedMetersWithLatestReadingAsync. Điều kiện cũ (m.Stall != null &&
            // m.Stall.Area.MarketId) khiến công tơ đang trong kho (StallId = null) hiện trong danh
            // sách nhưng trả 404 khi mở chi tiết.
            var result = await _context.Meters
                .Include(m => m.Stall)
                    .ThenInclude(s => s!.Area)
                .Where(m =>
                    m.MeterId == meterId &&
                    m.MarketId == marketId)
                .Select(m => new
                {
                    Meter = m,
                    LatestReading = m.MeterReadings
                        .OrderByDescending(r => r.RecordedAt)
                        .ThenByDescending(r => r.MeterReadingId)
                        .FirstOrDefault()
                })
                .AsNoTracking()
                .FirstOrDefaultAsync(ct);

            if (result == null) return null;
            return (result.Meter, result.LatestReading);
        }

        public async Task<bool> ExistsSerialNumberAsync(string serialNumber, int marketId, int? excludeMeterId = null, CancellationToken ct = default)
        {
            var normSerial = serialNumber.Trim().ToLower();
            var query = _context.Meters.Where(m => m.MarketId == marketId && m.SerialNumber.ToLower() == normSerial);
            if (excludeMeterId.HasValue)
            {
                query = query.Where(m => m.MeterId != excludeMeterId.Value);
            }
            return await query.AnyAsync(ct);
        }

        public async Task<IEnumerable<Meter>> GetUnassignedMetersAsync(string? type, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Meters
                .Where(m => m.StallId == null && m.IsActive == true);

            if (marketId.HasValue)
            {
                query = query.Where(m => m.MarketId == marketId.Value);
            }

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(m => m.Type == type);
            }

            return await query.ToListAsync(ct);
        }

        public async Task<IReadOnlyList<(Meter Meter, MeterReading? LatestReading)>> GetUnassignedMetersWithLatestReadingAsync(string? type, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Meters
                .Where(m => m.StallId == null && m.IsActive == true);

            if (marketId.HasValue)
            {
                query = query.Where(m => m.MarketId == marketId.Value);
            }

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(m => m.Type == type);
            }

            var results = await query
                .Select(m => new
                {
                    Meter = m,
                    LatestReading = m.MeterReadings
                        .OrderByDescending(r => r.RecordedAt)
                        .ThenByDescending(r => r.MeterReadingId)
                        .FirstOrDefault()
                })
                .AsNoTracking()
                .ToListAsync(ct);

            return results.Select(r => (r.Meter, r.LatestReading)).ToList();
        }

        public async Task<Meter?> GetMeterWithReadingsAsync(int meterId, CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.MeterReadings)
                .Include(m => m.Stall)
                .FirstOrDefaultAsync(m => m.MeterId == meterId, ct);
        }

        public async Task<Meter?> GetActiveMeterByStallAndTypeAsync(int stallId, string meterType, CancellationToken ct = default)
        {
            return await _context.Meters
                .Where(m => m.StallId == stallId && m.Type == meterType && m.IsActive == true)
                .FirstOrDefaultAsync(ct);
        }
    }
}
