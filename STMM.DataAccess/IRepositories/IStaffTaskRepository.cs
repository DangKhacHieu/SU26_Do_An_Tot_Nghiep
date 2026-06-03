using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IStaffTaskRepository : IBaseRepository<StaffTask>
    {
        Task<List<int>> GetAssignedIssueIdsAsync(int staffUserId, CancellationToken ct = default);
        Task<bool> HasAssignedTaskAsync(int issueId, int staffUserId, CancellationToken ct = default);
    }
}
