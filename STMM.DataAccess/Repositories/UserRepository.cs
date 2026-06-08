using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
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

        public async Task<bool> IsActiveStaffAsync(int userId, CancellationToken ct = default)
        {
            return await _context.Users
                .Include(u => u.Role)
                .AnyAsync(u => u.UserId == userId && u.Role.Name == "Staff" && u.Status == "Active" && u.IsDeleted != true, ct);
        }

        public async Task<IEnumerable<User>> GetUsersWithRolesAsync(string? roleName, string? search, bool limitToManageableRoles = false, CancellationToken ct = default)
        {
            var query = _dbSet
                .Include(u => u.Role)
                .Where(u => u.IsDeleted != true);

            if (!string.IsNullOrEmpty(roleName))
            {
                query = query.Where(u => u.Role.Name.ToLower() == roleName.ToLower());
            }
            else if (limitToManageableRoles)
            {
                var manageableRoles = new[] { "staff", "accountant", "vendor", "customer" };
                query = query.Where(u => manageableRoles.Contains(u.Role.Name.ToLower()));
            }

            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(u => u.Name.ToLower().Contains(searchLower) 
                                       || u.Email.ToLower().Contains(searchLower) 
                                       || u.Phone.Contains(searchLower) 
                                       || u.Cccd.Contains(searchLower));
            }

            return await query.AsNoTracking().ToListAsync(ct);
        }

        public async Task<User?> GetUserByIdWithRoleAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == id && u.IsDeleted != true, ct);
        }

        public async Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default)
        {
            return await _dbSet.AsQueryable()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Role.Name.ToLower() == "manager" || u.Role.Name.ToLower() == "admin", ct);
        }
    }
}
