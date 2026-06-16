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

        public async Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksPagedAsync(
            int? staffUserId, 
            string? status, 
            string? taskType, 
            string? search, 
            int pageNumber, 
            int pageSize, 
            CancellationToken ct = default)
        {
            var query = _context.StaffTasks
                .Include(t => t.AssignedToUser)
                .AsQueryable();

            if (staffUserId.HasValue)
            {
                query = query.Where(t => t.AssignedToUserId == staffUserId.Value);
            }

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
                var lowerSearch = search.ToLower();
                query = query.Where(t => t.Title.ToLower().Contains(lowerSearch) || 
                                         (t.Description != null && t.Description.ToLower().Contains(lowerSearch)));
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

        public async Task<StaffTask?> GetTaskByIdWithRelationsAsync(int taskId, CancellationToken ct = default)
        {
            return await _context.StaffTasks
                .Include(t => t.AssignedToUser)
                .Include(t => t.TaskMaterials)
                .Include(t => t.Issue)
                .Include(t => t.Request)
                .FirstOrDefaultAsync(t => t.TaskId == taskId, ct);
        }
    }
}
