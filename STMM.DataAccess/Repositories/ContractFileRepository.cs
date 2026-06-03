using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class ContractFileRepository : BaseRepository<ContractFile>, IContractFileRepository
    {
        public ContractFileRepository(AppDbContext context) : base(context)
        {
        }
    }
}
