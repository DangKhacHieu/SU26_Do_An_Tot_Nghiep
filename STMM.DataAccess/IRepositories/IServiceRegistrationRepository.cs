using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IServiceRegistrationRepository : IBaseRepository<ServiceRegistration>
    {
        Task<List<ServiceRegistration>> GetActiveServiceRegistrationsByStallIdAsync(int stallId, CancellationToken ct = default);
    }
}
