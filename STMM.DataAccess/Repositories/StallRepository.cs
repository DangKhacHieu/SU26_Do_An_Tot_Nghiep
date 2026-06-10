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

            var stallsList = await query
                .OrderBy(s => s.Code)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new {
                    s.StallId,
                    s.Code,
                    StallCategory = s.Category != null ? s.Category.Name : string.Empty,
                    StallStatus = s.Status ?? string.Empty,
                    VendorName = s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Select(c => c.Vendor.BusinessName)
                               .FirstOrDefault() ?? string.Empty,
                    VendorPhone = s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Select(c => c.Vendor.User.Phone)
                               .FirstOrDefault() ?? string.Empty,
                    HasUnpaidInvoice = s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .Any(c => c.Invoices.Any(i => i.Status == "Unpaid" && i.IsDeleted != true)),
                    UnpaidInvoiceCount = s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .SelectMany(c => c.Invoices.Where(i => i.Status == "Unpaid" && i.IsDeleted != true))
                               .Count(),
                    UnpaidTotalAmount = s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true)
                               .SelectMany(c => c.Invoices.Where(i => i.Status == "Unpaid" && i.IsDeleted != true))
                               .Sum(i => (decimal?)i.TotalAmount) ?? 0m,
                })
                .ToListAsync(ct);

            var stallIds = stallsList.Select(s => s.StallId).ToList();

            var issueTasks = await _context.StaffTasks
                .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Issue != null && stallIds.Contains(t.Issue.StallId))
                .Select(t => new { StallId = t.Issue.StallId, t.TaskType })
                .ToListAsync(ct);

            var requestTasks = await _context.StaffTasks
                .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Request != null && stallIds.Contains(t.Request.StallId))
                .Select(t => new { StallId = t.Request.StallId, t.TaskType })
                .ToListAsync(ct);

            var items = stallsList.Select(s => {
                var stallIssueTasks = issueTasks.Where(t => t.StallId == s.StallId).Select(t => t.TaskType);
                var stallRequestTasks = requestTasks.Where(t => t.StallId == s.StallId).Select(t => t.TaskType);
                var taskTypes = stallIssueTasks.Concat(stallRequestTasks).Distinct().ToList();

                return new StallTaskSummaryQueryResult(
                    s.StallId,
                    s.Code,
                    s.StallCategory,
                    s.StallStatus,
                    s.VendorName,
                    s.VendorPhone,
                    s.HasUnpaidInvoice,
                    s.UnpaidInvoiceCount,
                    s.UnpaidTotalAmount,
                    taskTypes.Count,
                    taskTypes
                );
            }).ToList();

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
