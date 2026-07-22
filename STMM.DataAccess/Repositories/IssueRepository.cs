using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class IssueRepository : BaseRepository<Issue>, IIssueRepository
    {
        public IssueRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(IEnumerable<Issue> Items, int TotalCount)> GetIssuesPagedAsync(
            int staffUserId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Issues
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .Where(i =>
                    i.CreatedByUserId == staffUserId ||
                    i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId));

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(i => i.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(i =>
                    i.Title.ToLower().Contains(term) ||
                    i.Description.ToLower().Contains(term) ||
                    i.Stall.Code.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync(ct);

            query = sortDescending
                ? query.OrderByDescending(i => i.CreatedAt)
                : query.OrderBy(i => i.CreatedAt);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public Task<Issue?> GetIssueForStaffAsync(
            int issueId,
            int staffUserId,
            CancellationToken ct = default)
        {
            return _context.Issues
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(i =>
                    i.IssueId == issueId &&
                    (i.CreatedByUserId == staffUserId ||
                     i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId)),
                    ct);
        }

        public async Task<Issue?> GetIssueWithRelationsAsync(int issueId, bool tracking = false, CancellationToken ct = default)
        {
            var query = _context.Issues
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .AsQueryable();

            if (!tracking)
            {
                query = query.AsNoTracking();
            }

            return await query.FirstOrDefaultAsync(i => i.IssueId == issueId, ct);
        }

        public async Task<bool> IsCreatorAsync(int issueId, int staffUserId, CancellationToken ct = default)
        {
            return await _context.Issues
                .AnyAsync(i => i.IssueId == issueId && i.CreatedByUserId == staffUserId, ct);
        }

        public async Task<(IEnumerable<Issue> Items, int TotalCount)> GetIssuesForManagerPagedAsync(
            int marketId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Issues
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .Where(i => i.Stall.Area.MarketId == marketId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(i => i.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(i =>
                    i.Title.ToLower().Contains(term) ||
                    i.Description.ToLower().Contains(term) ||
                    i.Stall.Code.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync(ct);

            query = sortDescending
                ? query.OrderByDescending(i => i.CreatedAt)
                : query.OrderBy(i => i.CreatedAt);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public Task<Issue?> GetIssueForManagerAsync(
            int issueId,
            int marketId,
            CancellationToken ct = default)
        {
            return _context.Issues
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(i =>
                    i.IssueId == issueId && i.Stall.Area.MarketId == marketId,
                    ct);
        }
    }
}
