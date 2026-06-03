using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class RepairPriceRepository : BaseRepository<RepairPrice>, IRepairPriceRepository
    {
        public RepairPriceRepository(AppDbContext context) : base(context)
        {
        }
    }
}
