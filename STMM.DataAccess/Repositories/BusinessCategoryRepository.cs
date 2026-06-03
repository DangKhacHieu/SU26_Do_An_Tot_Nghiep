using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class BusinessCategoryRepository : BaseRepository<BusinessCategory>, IBusinessCategoryRepository
    {
        public BusinessCategoryRepository(AppDbContext context) : base(context)
        {
        }
    }
}
