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
    public class FaqRepository : BaseRepository<Faq>, IFaqRepository
    {
        public FaqRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IEnumerable<Faq>> GetFaqsAsync(string? category, bool? isActive, CancellationToken ct = default)
        {
            var query = _dbSet.AsQueryable();

            if (!string.IsNullOrEmpty(category))
            {
                query = query.Where(f => f.Category == category);
            }

            if (isActive.HasValue)
            {
                query = query.Where(f => f.IsActive == isActive.Value);
            }

            return await query.OrderByDescending(f => f.CreatedAt).ToListAsync(ct);
        }
    }
}
