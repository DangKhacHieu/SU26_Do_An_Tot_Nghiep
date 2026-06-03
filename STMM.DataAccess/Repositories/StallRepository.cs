using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class StallRepository : BaseRepository<Stall>, IStallRepository
    {
        public StallRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(IEnumerable<Stall> Items, int TotalCount)> GetStallTasksPagedAsync(
            int staffUserId,
            string? search,
            string? filter,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Stalls.Where(s => s.IsDeleted != true);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var trimmedSearch = search.Trim().ToUpper();
                query = query.Where(s => s.Code.ToUpper().Contains(trimmedSearch));
            }

            if (filter == "HasUnpaidInvoice")
            {
                query = query.Where(s => s.Contracts.Any(c => c.IsDeleted != true && c.Status == "Active" &&
                                                             c.Invoices.Any(i => i.IsDeleted != true && i.Status == "Unpaid")));
            }
            else if (filter == "HasTask")
            {
                query = query.Where(s => s.Issues.Any(i => i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")) ||
                                     s.Requests.Any(r => r.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")));
            }
            else
            {
                query = query.Where(s =>
                    s.Contracts.Any(c => c.IsDeleted != true && c.Status == "Active" &&
                                         c.Invoices.Any(i => i.IsDeleted != true && i.Status == "Unpaid")) ||
                    s.Issues.Any(i => i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")) ||
                    s.Requests.Any(r => r.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed"))
                );
            }

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                .Include(s => s.Issues)
                    .ThenInclude(i => i.StaffTasks)
                .Include(s => s.Requests)
                    .ThenInclude(r => r.StaffTasks)
                .Include(s => s.Category)
                .OrderBy(s => s.Code)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }
    }
}
