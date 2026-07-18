using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Task;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IStaffTaskService
    {
        // Manager APIs
        Task<PagedResult<TaskSummaryDto>> GetTasksForManagerAsync(TaskQueryParams q, CancellationToken ct = default);
        Task<TaskDto> GetTaskByIdAsync(int taskId, CancellationToken ct = default);
        Task<TaskDto> CreateTaskAsync(int managerUserId, CreateTaskRequest req, CancellationToken ct = default);
        Task<TaskDto> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusRequest req, CancellationToken ct = default);
        Task<TaskDto> AssignTaskAsync(int taskId, int staffUserId, CancellationToken ct = default);

        // Staff APIs
        Task<PagedResult<TaskSummaryDto>> GetTasksForStaffAsync(int staffUserId, TaskQueryParams q, CancellationToken ct = default);
        Task<TaskDto> GetTaskByIdForStaffAsync(int taskId, int staffUserId, CancellationToken ct = default);
        Task<TaskDto> CompleteTaskAsync(int staffUserId, int taskId, CompleteTaskRequest req, CancellationToken ct = default);
        Task<List<UtilityStallChecklistDto>> GetStallsForUtilityTaskAsync(int taskId, int staffUserId, CancellationToken ct = default);
    }
}
