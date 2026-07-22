using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class StaffTaskRepository : BaseRepository<StaffTask>, IStaffTaskRepository
    {
        public StaffTaskRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<int>> GetAssignedIssueIdsAsync(int staffUserId, CancellationToken ct = default)
        {
            return await _context.StaffTasks
                .Where(t => t.AssignedToUserId == staffUserId && t.IssueId != null)
                .Select(t => t.IssueId!.Value)
                .ToListAsync(ct);
        }

        public async Task<bool> HasAssignedTaskAsync(int issueId, int staffUserId, CancellationToken ct = default)
        {
            return await _context.StaffTasks
                .AnyAsync(t => t.IssueId == issueId && t.AssignedToUserId == staffUserId, ct);
        }

        public Task<bool> HasActiveUtilityTaskForStallAsync(
            int staffUserId,
            int stallId,
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            return _context.StaffTasks.AnyAsync(t =>
                t.AssignedToUserId == staffUserId &&
                t.TaskType == "UtilityReading" &&
                t.Status != "Completed" &&
                t.Status != "Cancelled" &&
                t.Area != null &&
                t.Area.Stalls.Any(s =>
                    s.StallId == stallId &&
                    s.IsDeleted != true &&
                    s.Contracts.Any(c =>
                        c.IsDeleted != true &&
                        c.Status == "Active" &&
                        c.StartDate <= effectiveDate &&
                        c.EndDate >= effectiveDate)),
                ct);
        }

        public Task<bool> HasUtilityTaskForAreaInPeriodAsync(
            int areaId,
            DateTime periodStartUtc,
            DateTime periodEndUtc,
            CancellationToken ct = default)
        {
            return _context.StaffTasks.AnyAsync(t =>
                t.AreaId == areaId &&
                t.TaskType == "UtilityReading" &&
                t.Status != "Cancelled" &&
                t.CreatedAt.HasValue &&
                t.CreatedAt.Value >= periodStartUtc &&
                t.CreatedAt.Value < periodEndUtc,
                ct);
        }

        public Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksForStaffPagedAsync(
            int staffUserId,
            string? status,
            string? taskType,
            string? search,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = BuildTaskQuery()
                .Where(t => t.AssignedToUserId == staffUserId);

            return GetTasksPagedAsync(query, status, taskType, search, pageNumber, pageSize, ct);
        }

        public Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksForMarketPagedAsync(
            int marketId,
            int? staffUserId,
            string? status,
            string? taskType,
            string? search,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = BuildTaskQuery()
                .Where(t => t.AssignedToUser.MarketId == marketId);

            if (staffUserId.HasValue)
            {
                query = query.Where(t => t.AssignedToUserId == staffUserId.Value);
            }

            return GetTasksPagedAsync(query, status, taskType, search, pageNumber, pageSize, ct);
        }

        public async Task<IReadOnlyList<StaffTask>> GetTasksForStaffAsync(
            int staffUserId,
            CancellationToken ct = default)
        {
            return await BuildTaskQuery()
                .Where(t => t.AssignedToUserId == staffUserId)
                .OrderByDescending(t => t.CreatedAt)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<StaffTask?> GetTaskByIdWithRelationsAsync(int taskId, CancellationToken ct = default)
        {
            return await BuildTaskQuery(includeMaterials: true)
                .FirstOrDefaultAsync(t => t.TaskId == taskId, ct);
        }

        public async Task<StaffTask?> GetTaskByIdForStaffAsync(int taskId, int staffUserId, CancellationToken ct = default)
        {
            return await BuildTaskQuery(includeMaterials: true)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.AssignedToUserId == staffUserId, ct);
        }

        public async Task<StaffTask?> GetTaskByIdForMarketAsync(int taskId, int marketId, CancellationToken ct = default)
        {
            return await BuildTaskQuery(includeMaterials: true)
                .FirstOrDefaultAsync(t => t.TaskId == taskId && t.AssignedToUser.MarketId == marketId, ct);
        }

        public async Task<IReadOnlyList<StaffTask>> GetRepairTasksForRequestInMarketAsync(
            int requestId,
            int marketId,
            CancellationToken ct = default)
        {
            return await _context.StaffTasks
                .Include(t => t.AssignedToUser)
                .Where(t =>
                    t.RequestId == requestId &&
                    t.TaskType == "Repair" &&
                    t.AssignedToUser.MarketId == marketId)
                .ToListAsync(ct);
        }

        private IQueryable<StaffTask> BuildTaskQuery(bool includeMaterials = false)
        {
            IQueryable<StaffTask> query = _context.StaffTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.Area)
                .Include(t => t.Request).ThenInclude(r => r!.Stall)
                .Include(t => t.Issue).ThenInclude(i => i!.Stall);

            if (includeMaterials)
            {
                query = query.Include(t => t.TaskMaterials);
            }

            return query;
        }

        private static async Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksPagedAsync(
            IQueryable<StaffTask> query,
            string? status,
            string? taskType,
            string? search,
            int pageNumber,
            int pageSize,
            CancellationToken ct)
        {
            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(t => t.Status == status);
            }

            if (!string.IsNullOrWhiteSpace(taskType))
            {
                query = query.Where(t => t.TaskType == taskType);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                var normalizedSearch = search.Trim().ToLower();
                query = query.Where(t =>
                    t.Title.ToLower().Contains(normalizedSearch) ||
                    (t.Description != null && t.Description.ToLower().Contains(normalizedSearch)));
            }

            var totalCount = await query.CountAsync(ct);
            var items = await query
                .OrderByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }
    }
}
