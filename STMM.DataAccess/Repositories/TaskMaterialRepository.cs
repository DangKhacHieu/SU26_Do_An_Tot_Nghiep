using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class TaskMaterialRepository : BaseRepository<TaskMaterial>, ITaskMaterialRepository
    {
        public TaskMaterialRepository(AppDbContext context) : base(context)
        {
        }

        /// <inheritdoc />
        public async Task<List<TaskMaterial>> GetByTaskIdAsync(int taskId, CancellationToken ct = default)
        {
            return await _context.TaskMaterials
                .Where(m => m.TaskId == taskId)
                .OrderBy(m => m.Id)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        /// <inheritdoc />
        public async Task<TaskMaterial?> GetMaterialByIdAsync(int id, CancellationToken ct = default)
        {
            return await _context.TaskMaterials
                .FirstOrDefaultAsync(m => m.Id == id, ct);
        }
    }
}

