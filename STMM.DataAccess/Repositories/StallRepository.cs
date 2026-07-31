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

            var linkedTasks = await _context.StaffTasks
                .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Status != "Cancelled" && t.Issue != null && stallIds.Contains(t.Issue.StallId))
                .Select(t => new { StallId = t.Issue!.StallId, t.TaskType })
                .Concat(_context.StaffTasks
                    .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed" && t.Status != "Cancelled" && t.Request != null && stallIds.Contains(t.Request.StallId))
                    .Select(t => new { StallId = t.Request!.StallId, t.TaskType }))
                .AsNoTracking()
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

            var linkedTaskTypesByStall = linkedTasks
                .GroupBy(t => t.StallId)
                .ToDictionary(group => group.Key, group => group.Select(t => t.TaskType).ToList());
            var utilityTaskTypesByArea = areaTasks
                .GroupBy(t => t.AreaId)
                .ToDictionary(group => group.Key, group => group.Select(t => t.TaskType).ToList());

            var items = stallsList.Select(s => {
                var assignedTasks = linkedTaskTypesByStall.GetValueOrDefault(s.StallId, [])
                    .Concat(utilityEligibleStallIds.Contains(s.StallId)
                        ? utilityTaskTypesByArea.GetValueOrDefault(s.AreaId, [])
                        : [])
                    .ToList();
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
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            var query = _context.Stalls
                .Where(s => s.IsDeleted != true &&
                            s.Area.MarketId == marketId &&
                            s.Status == "Rented" &&
                            s.Contracts.Any(c => c.IsDeleted != true &&
                                                 c.Status == "Active" &&
                                                 c.StartDate <= effectiveDate &&
                                                 c.EndDate >= effectiveDate));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Code.ToLower().Contains(term) ||
                    s.Area.Name.ToLower().Contains(term) ||
                    s.Contracts.Any(c => c.Status == "Active" && c.IsDeleted != true &&
                                         c.StartDate <= effectiveDate && c.EndDate >= effectiveDate &&
                                         (c.Vendor.User.Name.ToLower().Contains(term) || c.Vendor.BusinessName.ToLower().Contains(term))));
            }

            return await query
                .OrderBy(s => s.Code)
                .Take(limit)
                .Select(s => new StaffStallLookupQueryResult(
                    s.StallId,
                    s.Code,
                    s.Area.Name,
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true && c.StartDate <= effectiveDate && c.EndDate >= effectiveDate)
                               .OrderByDescending(c => c.StartDate)
                               .ThenByDescending(c => c.ContractId)
                               .Select(c => c.Vendor.User.Name ?? c.Vendor.BusinessName)
                               .FirstOrDefault()))
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<IEnumerable<StaffStallLookupQueryResult>> GetStaffIssueStallLookupAsync(
            int marketId,
            string? search,
            int limit,
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            var query = _context.Stalls
                .Where(s => s.Area.MarketId == marketId &&
                            s.IsDeleted != true &&
                            (s.Status == "Maintenance" ||
                             (s.Status == "Rented" &&
                              s.Contracts.Any(c => c.IsDeleted != true &&
                                                   c.Status == "Active" &&
                                                   c.StartDate <= effectiveDate &&
                                                   c.EndDate >= effectiveDate))));

            if (!string.IsNullOrWhiteSpace(search))
            {
                var term = search.Trim().ToLower();
                query = query.Where(s =>
                    s.Code.ToLower().Contains(term) ||
                    s.Area.Name.ToLower().Contains(term) ||
                    s.Contracts.Any(c => c.Status == "Active" && c.IsDeleted != true &&
                                         c.StartDate <= effectiveDate && c.EndDate >= effectiveDate &&
                                         (c.Vendor.User.Name.ToLower().Contains(term) || c.Vendor.BusinessName.ToLower().Contains(term))));
            }

            return await query
                .OrderBy(s => s.Code)
                .Take(limit)
                .Select(s => new StaffStallLookupQueryResult(
                    s.StallId,
                    s.Code,
                    s.Area.Name,
                    s.Status == "Maintenance" ? null :
                    s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true && c.StartDate <= effectiveDate && c.EndDate >= effectiveDate)
                               .OrderByDescending(c => c.StartDate)
                               .ThenByDescending(c => c.ContractId)
                               .Select(c => c.Vendor.User.Name ?? c.Vendor.BusinessName)
                               .FirstOrDefault()))
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

        public Task<Stall?> GetEligibleRentedStallForMarketAsync(
            int stallId,
            int marketId,
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            return _context.Stalls
                .Include(s => s.Area)
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.StallId == stallId &&
                    s.IsDeleted != true &&
                    s.Area.MarketId == marketId &&
                    s.Status == "Rented" &&
                    s.Contracts.Any(c => c.IsDeleted != true &&
                                         c.Status == "Active" &&
                                         c.StartDate <= effectiveDate &&
                                         c.EndDate >= effectiveDate),
                    ct);
        }

        public Task<Stall?> GetEligibleIssueStallForMarketAsync(
            int stallId,
            int marketId,
            DateOnly effectiveDate,
            CancellationToken ct = default)
        {
            return _context.Stalls
                .Include(s => s.Area)
                .AsNoTracking()
                .FirstOrDefaultAsync(s =>
                    s.StallId == stallId &&
                    s.IsDeleted != true &&
                    s.Area.MarketId == marketId &&
                    (s.Status == "Maintenance" ||
                     (s.Status == "Rented" &&
                      s.Contracts.Any(c => c.IsDeleted != true &&
                                           c.Status == "Active" &&
                                           c.StartDate <= effectiveDate &&
                                           c.EndDate >= effectiveDate))),
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
                .Select(s => new
                {
                    Stall = s,
                    ElectricityMeters = s.Meters.Where(m => m.IsActive == true && m.Type == "Electricity"),
                    WaterMeters = s.Meters.Where(m => m.IsActive == true && m.Type == "Water")
                })
                .Select(x => new StallChecklistQueryResult(
                    x.Stall.StallId,
                    x.Stall.Code,
                    x.Stall.Status ?? string.Empty,
                    x.ElectricityMeters.Any(),
                    x.WaterMeters.Any(),
                    x.ElectricityMeters.Any() && x.ElectricityMeters.All(m =>
                        m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month)),
                    x.WaterMeters.Any() && x.WaterMeters.All(m =>
                        m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month)),
                    x.ElectricityMeters.Any() &&
                    x.WaterMeters.Any() &&
                    x.ElectricityMeters.All(m =>
                        m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month)) &&
                    x.WaterMeters.All(m =>
                        m.MeterReadings.Any(mr => mr.RecordedAt.Year == year && mr.RecordedAt.Month == month))
                ))
                .ToListAsync(ct);
        }
    }
}
