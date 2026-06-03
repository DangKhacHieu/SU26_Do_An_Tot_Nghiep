using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class ServiceRegistrationRepository : BaseRepository<ServiceRegistration>, IServiceRegistrationRepository
    {
        public ServiceRegistrationRepository(AppDbContext context) : base(context)
        {
        }
    }
}
