using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class ViolationRepository : BaseRepository<Violation>, IViolationRepository
    {
        public ViolationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedAsync(
            int userId,
            string? status,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Violations
                .Include(v => v.Stall)
                .Where(v => v.CreatedByUserId == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(v => v.Status == status);
            }

            var totalCount = await query.CountAsync(ct);

            query = sortDescending
                ? query.OrderByDescending(v => v.CreatedAt)
                : query.OrderBy(v => v.CreatedAt);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<Violation?> GetViolationWithStallAsync(int id, int userId, CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.ViolationId == id && v.CreatedByUserId == userId, ct);
        }
    }
}
