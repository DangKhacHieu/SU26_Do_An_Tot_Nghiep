using STMM.Business.DTOs.Task;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IStaffTaskService
    {
        // Manager APIs
        Task<IReadOnlyList<TaskSummaryDto>> GetTasksForManagerAsync(int? managerUserId, CancellationToken ct = default);
        Task<TaskDto> GetTaskByIdForManagerAsync(int taskId, int? managerUserId, CancellationToken ct = default);
        Task<TaskDto> CreateTaskAsync(int managerUserId, CreateTaskRequest req, CancellationToken ct = default);
        Task<TaskDto> UpdateTaskStatusAsync(int managerUserId, int taskId, UpdateTaskStatusRequest req, CancellationToken ct = default);
        Task<TaskDto> AssignTaskAsync(int managerUserId, int taskId, int staffUserId, CancellationToken ct = default);

        // Staff APIs
        Task<IReadOnlyList<TaskSummaryDto>> GetTasksForStaffAsync(int staffUserId, CancellationToken ct = default);
        Task<TaskDto> GetTaskByIdForStaffAsync(int taskId, int staffUserId, CancellationToken ct = default);
        Task<TaskDto> CompleteTaskAsync(int staffUserId, int taskId, CompleteTaskRequest req, CancellationToken ct = default);
        Task<List<UtilityStallChecklistDto>> GetStallsForUtilityTaskAsync(int taskId, int staffUserId, CancellationToken ct = default);
    }
}
