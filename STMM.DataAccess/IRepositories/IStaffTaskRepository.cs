using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public interface IStaffTaskRepository : IBaseRepository<StaffTask>
    {
        Task<List<int>> GetAssignedIssueIdsAsync(int staffUserId, CancellationToken ct = default);
        Task<bool> HasAssignedTaskAsync(int issueId, int staffUserId, CancellationToken ct = default);
        
        Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksPagedAsync(
            int? staffUserId, 
            string? status, 
            string? taskType, 
            string? search, 
            int pageNumber, 
            int pageSize, 
            CancellationToken ct = default);
            
        Task<StaffTask?> GetTaskByIdWithRelationsAsync(int taskId, CancellationToken ct = default);
    }
}
