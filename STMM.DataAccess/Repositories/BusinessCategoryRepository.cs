using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class BusinessCategoryRepository : BaseRepository<BusinessCategory>, IBusinessCategoryRepository
    {
        public BusinessCategoryRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<BusinessCategory>> GetAllCategoriesAsync(string? searchTerm = null, bool? isActive = null, int? marketId = null, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(c => c.MarketId == marketId.Value);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(c => c.Name.ToLower().Contains(term) || c.Code.ToLower().Contains(term));
            }

            if (isActive.HasValue)
            {
                query = query.Where(c => c.IsActive == isActive.Value);
            }

            return await query.OrderByDescending(c => c.CreatedAt).ToListAsync(ct);
        }

        public async Task<BusinessCategory?> GetCategoryByIdAsync(int id, CancellationToken ct = default)
        {
            return await _dbSet.FirstOrDefaultAsync(c => c.CategoryId == id, ct);
        }
    }
}
