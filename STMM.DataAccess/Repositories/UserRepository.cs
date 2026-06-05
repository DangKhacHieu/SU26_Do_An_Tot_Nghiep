using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.Repositories
{
    public class UserRepository : BaseRepository<User>, IUserRepository
    {
        public UserRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<bool> IsActiveStaffAsync(int userId, CancellationToken ct = default)
        {
            return await _context.Users
                .Include(u => u.Role)
                .AnyAsync(u => u.UserId == userId && u.Role.Name == "Staff" && u.Status == "Active" && u.IsDeleted != true, ct);
        }
    }
}
