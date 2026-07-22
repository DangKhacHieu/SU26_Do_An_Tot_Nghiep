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

        public async Task<IReadOnlyList<StallTaskSummaryQueryResult>> GetStallTasksAsync(
            int staffUserId,
            int marketId,
            CancellationToken ct = default)
        {
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var query = _context.Stalls.Where(s =>
                s.IsDeleted != true &&
                s.Area.MarketId == marketId);

            query = query.Where(s =>
                s.Contracts.Any(c => c.IsDeleted != true && c.Status == "Active" &&
                                     c.Invoices.Any(i => i.IsDeleted != true && i.Status == "Unpaid")) ||
                s.Issues.Any(i => i.StaffTasks.Any(t =>
                    t.AssignedToUserId == staffUserId &&
                    t.Status != "Completed" &&
                    t.Status != "Cancelled")) ||
                s.Requests.Any(r => r.StaffTasks.Any(t =>
                    t.AssignedToUserId == staffUserId &&
                    t.Status != "Completed" &&
                    t.Status != "Cancelled")) ||
                s.Area.StaffTasks.Any(t =>
                    t.AssignedToUserId == staffUserId &&
                    t.Status != "Completed" &&
                    t.Status != "Cancelled" &&
                    t.TaskType == "UtilityReading" &&
                    s.Contracts.Any(c =>
                        c.IsDeleted != true &&
                        c.Status == "Active" &&
                        c.StartDate <= effectiveDate &&
                        c.EndDate >= effectiveDate)));

            var stallsList = await query
                .OrderBy(s => s.Code)
                .Select(s => new {
                    s.StallId,
                    s.AreaId,
                    s.Code,
                    StallCategory = s.Category != null ? s.Category.Name : string.Empty,
                    StallStatus = s.Status ?? string.Empty,
                    HasEffectiveContract = s.Contracts.Any(c =>
                        c.IsDeleted != true &&
                        c.Status == "Active" &&
                        c.StartDate <= effectiveDate &&
                        c.EndDate >= effectiveDate),
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
                .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Status != "Cancelled" && t.Issue != null && stallIds.Contains(t.Issue.StallId))
                .Select(t => new { StallId = t.Issue!.StallId, t.TaskType })
                .ToListAsync(ct);

            var requestTasks = await _context.StaffTasks
                .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Status != "Cancelled" && t.Request != null && stallIds.Contains(t.Request.StallId))
                .Select(t => new { StallId = t.Request!.StallId, t.TaskType })
                .ToListAsync(ct);

            var areaIds = stallsList.Select(s => s.AreaId).Distinct().ToList();
            var areaTasks = await _context.StaffTasks
                .Where(t =>
                    t.AssignedToUserId == staffUserId &&
                    t.Status != "Completed" &&
                    t.Status != "Cancelled" &&
                    t.TaskType == "UtilityReading" &&
                    t.AreaId.HasValue &&
                    areaIds.Contains(t.AreaId.Value))
                .Select(t => new { AreaId = t.AreaId!.Value, t.TaskType })
                .ToListAsync(ct);

            var utilityEligibleStallIds = stallsList
                .Where(s => s.HasEffectiveContract)
                .Select(s => s.StallId)
                .ToHashSet();

            var items = stallsList.Select(s => {
                var stallIssueTasks = issueTasks.Where(t => t.StallId == s.StallId).Select(t => t.TaskType);
                var stallRequestTasks = requestTasks.Where(t => t.StallId == s.StallId).Select(t => t.TaskType);
                var stallAreaTasks = areaTasks
                    .Where(t =>
                        t.AreaId == s.AreaId &&
                        utilityEligibleStallIds.Contains(s.StallId))
                    .Select(t => t.TaskType);
                var assignedTasks = stallIssueTasks.Concat(stallRequestTasks).Concat(stallAreaTasks).ToList();
                var taskTypes = assignedTasks.Distinct().ToList();

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
                    assignedTasks.Count,
                    taskTypes
                );
            }).ToList();

            return items;
        }

        public async Task<IEnumerable<StaffStallLookupQueryResult>> GetStaffStallLookupAsync(
            int marketId,
            string? search,
            int limit,
            CancellationToken ct = default)
        {
            var query = _context.Stalls
                .Where(s => s.IsDeleted != true && s.Area.MarketId == marketId);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Code.ToLower().Contains(term) ||
                    s.Area.Name.ToLower().Contains(term));
            }

            return await query
                .OrderBy(s => s.Code)
                .Take(limit)
                .Select(s => new StaffStallLookupQueryResult(s.StallId, s.Code, s.Area.Name))
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public Task<Stall?> GetStallForMarketAsync(int stallId, int marketId, CancellationToken ct = default)
        {
            return _context.Stalls
                .Include(s => s.Area)
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.StallId == stallId &&
                    s.IsDeleted != true &&
                    s.Area.MarketId == marketId,
                    ct);
        }

        public async Task<List<StallChecklistQueryResult>> GetStallsChecklistByAreaAsync(
            int areaId,
            DateOnly effectiveDate,
            int year,
            int month,
            CancellationToken ct = default)
        {
            return await _context.Stalls
                .Where(s =>
                    s.AreaId == areaId &&
                    s.IsDeleted != true &&
                    s.Contracts.Any(c =>
                        c.IsDeleted != true &&
                        c.Status == "Active" &&
                        c.StartDate <= effectiveDate &&
                        c.EndDate >= effectiveDate))
                .OrderBy(s => s.Code)
                .Select(s => new StallChecklistQueryResult(
                    s.StallId,
                    s.Code,
                    s.Status ?? string.Empty,
                    s.Meters.Any(m => m.IsActive == true && m.Type == "Electricity"),
                    s.Meters.Any(m => m.IsActive == true && m.Type == "Water"),
                    s.Meters.Any(m => m.IsActive == true && m.Type == "Electricity") &&
                    s.Meters.Any(m => m.IsActive == true && m.Type == "Water") &&
                    s.Meters.Where(m =>
                            m.IsActive == true &&
                            (m.Type == "Electricity" || m.Type == "Water"))
                        .All(m => m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month))
                ))
                .ToListAsync(ct);
        }
    }
}
