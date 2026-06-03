using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class TaskMaterialRepository : BaseRepository<TaskMaterial>, ITaskMaterialRepository
    {
        public TaskMaterialRepository(AppDbContext context) : base(context)
        {
        }
    }
}
