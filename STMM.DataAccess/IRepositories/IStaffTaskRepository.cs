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
        Task<bool> HasActiveTaskForIssueAsync(int issueId, CancellationToken ct = default);
        Task<bool> HasActiveTaskForRequestAsync(int requestId, CancellationToken ct = default);
        Task<bool> HasActiveUtilityTaskForStallAsync(
            int staffUserId,
            int stallId,
            DateOnly effectiveDate,
            CancellationToken ct = default);
        Task<bool> HasUtilityTaskForAreaInPeriodAsync(
            int areaId,
            DateTime periodStartUtc,
            DateTime periodEndUtc,
            CancellationToken ct = default);

        Task<(IEnumerable<StaffTask> Items, int TotalCount)> GetTasksForStaffPagedAsync(
            int staffUserId,
            string? status,
            string? taskType,
            string? search,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<IReadOnlyList<StaffTask>> GetTasksForStaffAsync(
            int staffUserId,
            CancellationToken ct = default);

        Task<IReadOnlyList<StaffTask>> GetTasksForMarketAsync(
            int marketId,
            CancellationToken ct = default);
            
        Task<StaffTask?> GetTaskByIdWithRelationsAsync(int taskId, CancellationToken ct = default);
        Task<StaffTask?> GetTaskByIdForStaffAsync(
            int taskId,
            int staffUserId,
            CancellationToken ct = default);
        Task<StaffTask?> GetTaskByIdForStaffAsync(
            int taskId,
            int staffUserId,
            bool includeMaterials,
            CancellationToken ct = default);
        Task<StaffTask?> GetTaskByIdForMarketAsync(int taskId, int marketId, CancellationToken ct = default);
        Task<IReadOnlyList<StaffTask>> GetRepairTasksForRequestInMarketAsync(
            int requestId,
            int marketId,
            CancellationToken ct = default);
    }
}
