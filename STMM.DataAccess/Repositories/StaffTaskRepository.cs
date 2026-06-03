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
    }
}
