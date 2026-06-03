using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class MarketRepository : BaseRepository<Market>, IMarketRepository
    {
        public MarketRepository(AppDbContext context) : base(context)
        {
        }
    }
}
