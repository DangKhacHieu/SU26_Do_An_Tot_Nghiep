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
    }
}
