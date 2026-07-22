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
            int marketId,
            CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.Stall)
                .Where(m => m.MarketId == marketId)
                .OrderBy(m => m.MeterId)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<bool> ExistsSerialNumberAsync(string serialNumber, int? excludeMeterId = null, CancellationToken ct = default)
        {
            var normSerial = serialNumber.Trim().ToLower();
            var query = _context.Meters.Where(m => m.SerialNumber.ToLower() == normSerial);
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
