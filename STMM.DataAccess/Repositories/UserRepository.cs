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

        public async Task<IEnumerable<User>> GetUsersWithRolesAsync(string? roleName, string? search, bool limitToManageableRoles = false, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet
                .Include(u => u.Role)
                .Where(u => u.IsDeleted != true);

            if (marketId.HasValue)
            {
                query = query.Where(u => u.MarketId == marketId.Value);
            }

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

        public async Task<IReadOnlyList<User>> GetActiveManagersByMarketAsync(
            int marketId,
            CancellationToken ct = default)
        {
            return await _dbSet
                .Include(user => user.Role)
                .Where(user => user.MarketId == marketId
                    && user.Role.Name == "Manager"
                    && user.Status == "Active"
                    && user.IsDeleted != true)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<IReadOnlyList<User>> GetActiveUsersByRoleAsync(
            string? roleName,
            CancellationToken ct = default)
        {
            var query = _dbSet
                .Include(user => user.Role)
                .Where(user => user.Status == "Active" && user.IsDeleted != true);

            if (!string.IsNullOrWhiteSpace(roleName)
                && !roleName.Equals("Public", System.StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(user => user.Role.Name == roleName);
            }

            return await query
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<User?> GetUserByIdWithRoleAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet
                .Include(u => u.Role)
                .Include(u => u.Vendor)
                .FirstOrDefaultAsync(u => u.UserId == id && u.IsDeleted != true, ct);
        }

        public async Task<User?> GetFirstManagerOrAdminAsync(CancellationToken ct = default)
        {
            return await _dbSet.AsQueryable()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Role.Name.ToLower() == "manager" || u.Role.Name.ToLower() == "admin", ct);
        }

        public async Task<User?> GetUserByEmailAsync(string email, CancellationToken ct = default)
        {
            return await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == email.Trim().ToLower(), ct);
        }

        public async Task<User?> GetFirstUserByRoleAsync(string roleName, CancellationToken ct = default)
        {
            return await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Role.Name.ToLower() == roleName.ToLower(), ct);
        }

        public async Task<bool> IsEmailExistsAsync(string email, int? excludeId = null, CancellationToken ct = default)
        {
            var query = _context.Users.Where(u => u.Email.ToLower() == email.ToLower());
            if (excludeId.HasValue)
            {
                query = query.Where(u => u.UserId != excludeId.Value);
            }
            return await query.AnyAsync(ct);
        }
    }
}
