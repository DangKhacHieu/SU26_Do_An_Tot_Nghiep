using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default)
        {
            return await _dbSet.AsQueryable()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Role.Name.ToLower() == "manager" || u.Role.Name.ToLower() == "admin", ct);
        }
    }
}
