using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class FeeTypeRepository : BaseRepository<FeeType>, IFeeTypeRepository
    {
        public FeeTypeRepository(AppDbContext context) : base(context)
        {
        }
    }
}
