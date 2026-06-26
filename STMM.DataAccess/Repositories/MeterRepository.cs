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

        public async Task<Meter?> GetMeterWithStallAsync(int meterId, CancellationToken ct = default)
        {
            return await _context.Meters
                .Include(m => m.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(m => m.MeterId == meterId, ct);
        }

        public async Task<(IEnumerable<Meter> Items, int TotalCount)> GetMetersPagedAsync(string? type, bool? isActive, bool? isAssigned, string? search, int pageNumber, int pageSize, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Meters
                .Include(m => m.Stall)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(m => m.MarketId == marketId.Value);
            }

            if (!string.IsNullOrEmpty(type))
            {
                query = query.Where(m => m.Type == type);
            }

            if (isActive.HasValue)
            {
                query = query.Where(m => m.IsActive == isActive.Value);
            }

            if (isAssigned.HasValue)
            {
                if (isAssigned.Value)
                {
                    query = query.Where(m => m.StallId != null);
                }
                else
                {
                    query = query.Where(m => m.StallId == null);
                }
            }

            if (!string.IsNullOrEmpty(search))
            {
                var normSearch = search.Trim().ToLower();
                query = query.Where(m => m.SerialNumber.ToLower().Contains(normSearch));
            }

            var totalCount = await query.CountAsync(ct);
            var items = await query
                .OrderBy(m => m.MeterId)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync(ct);

            return (items, totalCount);
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
    }
}
