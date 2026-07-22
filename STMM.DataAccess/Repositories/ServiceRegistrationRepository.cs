using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class ServiceRegistrationRepository : BaseRepository<ServiceRegistration>, IServiceRegistrationRepository
    {
        public ServiceRegistrationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<List<ServiceRegistration>> GetActiveServiceRegistrationsByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            return await _context.ServiceRegistrations
                .Include(sr => sr.Service)
                .Where(sr => sr.StallId == stallId && sr.Status == "Active")
                .ToListAsync(ct);
        }

        public async Task<ServiceRegistration?> GetRegistrationWithRelationsAsync(int id)
        {
            return await _context.ServiceRegistrations
                .Include(r => r.Service)
                .Include(r => r.Stall)
                .FirstOrDefaultAsync(r => r.RegistrationId == id);
        }
    }
}
