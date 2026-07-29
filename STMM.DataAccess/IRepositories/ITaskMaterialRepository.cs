using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    /// <summary>
    /// Repository for task_materials — manages repair material lines linked to a StaffTask.
    /// </summary>
    public interface ITaskMaterialRepository : IBaseRepository<TaskMaterial>
    {
        /// <summary>
        /// Returns all material lines for a given task, ordered by insertion time.
        /// </summary>
        Task<List<TaskMaterial>> GetByTaskIdAsync(int taskId, CancellationToken ct = default);

        /// <summary>
        /// Returns a single material line by its primary key, or null if not found.
        /// </summary>
        Task<TaskMaterial?> GetMaterialByIdAsync(int id, CancellationToken ct = default);
        Task<TaskMaterial?> GetMaterialByIdForTaskAsync(int id, int taskId, CancellationToken ct = default);

        Task<Dictionary<int, int>> GetUsageCountsAsync(CancellationToken ct = default);
        Task<int> GetUsageCountByRepairPriceIdAsync(int repairPriceId, CancellationToken ct = default);
        Task<bool> IsRepairPriceInUseAsync(int repairPriceId, CancellationToken ct = default);
        Task<List<TaskMaterial>> GetUsedRepairToolsWithDetailsAsync(int? marketId = null, CancellationToken ct = default);
    }
}

