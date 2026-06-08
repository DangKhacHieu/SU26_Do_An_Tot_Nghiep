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

        public async Task<(IEnumerable<StallTaskSummaryQueryResult> Items, int TotalCount)> GetStallTasksPagedAsync(
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
                .OrderBy(s => s.Code)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new StallTaskSummaryQueryResult(
                    s.StallId,
                    s.Code,
                    s.Category != null ? s.Category.Name : string.Empty,
                    s.Status ?? string.Empty,
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Select(c => c.Vendor.BusinessName)
                               .FirstOrDefault() ?? string.Empty,
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Select(c => c.Vendor.User.Phone)
                               .FirstOrDefault() ?? string.Empty,
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Any(c => c.Invoices.Any(i => i.Status == "Unpaid" && i.IsDeleted != true)),
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .SelectMany(c => c.Invoices.Where(i => i.Status == "Unpaid" && i.IsDeleted != true))
                               .Count(),
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .SelectMany(c => c.Invoices.Where(i => i.Status == "Unpaid" && i.IsDeleted != true))
                               .Sum(i => (decimal?)i.TotalAmount) ?? 0m,
                    s.Issues.SelectMany(i => i.StaffTasks).Count(t => t.AssignedToUserId == staffUserId && t.Status != "Completed") +
                    s.Requests.SelectMany(r => r.StaffTasks).Count(t => t.AssignedToUserId == staffUserId && t.Status != "Completed"),
                    s.Issues.SelectMany(i => i.StaffTasks)
                            .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")
                            .Select(t => t.TaskType)
                            .Concat(
                                s.Requests.SelectMany(r => r.StaffTasks)
                                          .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")
                                          .Select(t => t.TaskType)
                            )
                            .Distinct()
                ))
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<List<StallChecklistQueryResult>> GetStallsChecklistByAreaAsync(int areaId, int year, int month, CancellationToken ct = default)
        {
            return await _context.Stalls
                .Where(s => s.AreaId == areaId && s.IsDeleted != true && s.Status == "Rented")
                .OrderBy(s => s.Code)
                .Select(s => new StallChecklistQueryResult(
                    s.StallId,
                    s.Code,
                    s.Status ?? string.Empty,
                    s.Meters.Any(m => m.IsActive == true) && 
                    s.Meters.Where(m => m.IsActive == true)
                        .All(m => m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month))
                ))
                .ToListAsync(ct);
        }
    }
}
