using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Linq;
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
                .Include(m => m.RepairPrice)
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

        public Task<TaskMaterial?> GetMaterialByIdForTaskAsync(int id, int taskId, CancellationToken ct = default)
        {
            return _context.TaskMaterials.FirstOrDefaultAsync(m => m.Id == id && m.TaskId == taskId, ct);
        }

        public async Task<Dictionary<int, int>> GetUsageCountsAsync(CancellationToken ct = default)
        {
            return await _context.TaskMaterials
                .GroupBy(m => m.RepairPriceId)
                .Select(g => new { RepairPriceId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.RepairPriceId, x => x.Count, ct);
        }

        public async Task<int> GetUsageCountByRepairPriceIdAsync(int repairPriceId, CancellationToken ct = default)
        {
            return await _context.TaskMaterials
                .Where(m => m.RepairPriceId == repairPriceId)
                .CountAsync(ct);
        }

        public async Task<bool> IsRepairPriceInUseAsync(int repairPriceId, CancellationToken ct = default)
        {
            return await _context.TaskMaterials
                .AnyAsync(m => m.RepairPriceId == repairPriceId, ct);
        }

        public async Task<List<TaskMaterial>> GetUsedRepairToolsWithDetailsAsync(int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.TaskMaterials
                .Include(m => m.RepairPrice)
                .Include(m => m.StaffTask)
                    .ThenInclude(t => t.AssignedToUser)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(m => m.RepairPrice.MarketId == marketId.Value);
            }

            return await query
                .OrderByDescending(m => m.Id)
                .ToListAsync(ct);
        }
    }
}

