using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IServiceRegistrationRepository : IBaseRepository<ServiceRegistration>
    {
        Task<ServiceRegistration?> GetRegistrationWithRelationsAsync(int id);
    }
}
