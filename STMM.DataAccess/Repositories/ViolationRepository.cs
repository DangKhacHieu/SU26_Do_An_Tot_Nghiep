using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.DataAccess.Repositories
{
    public class ViolationRepository : BaseRepository<Violation>, IViolationRepository
    {
        public ViolationRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<IReadOnlyList<Violation>> GetViolationsForStaffAsync(
            int userId,
            CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.Stall)
                .Where(v => v.CreatedByUserId == userId)
                .OrderByDescending(v => v.CreatedAt)
                .AsNoTracking()
                .ToListAsync(ct);
        }

        public async Task<Violation?> GetViolationWithStallAsync(int id, int userId, CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.ViolationId == id && v.CreatedByUserId == userId, ct);
        }

        public async Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedForManagerAsync(
            int? marketId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            if (marketId == null)
            {
                return (new List<Violation>(), 0);
            }

            var query = _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .Where(v => v.Stall.Area.MarketId == marketId.Value);

            if (!string.IsNullOrWhiteSpace(status))
            {
                var trimmedStatus = status.Trim();
                query = query.Where(v => v.Status == trimmedStatus);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(v => v.Title.ToLower().Contains(term)
                                         || v.Description.ToLower().Contains(term)
                                         || v.Stall.Code.ToLower().Contains(term));
            }

            query = sortDescending
                ? query.OrderByDescending(v => v.CreatedAt)
                : query.OrderBy(v => v.CreatedAt);

            var totalCount = await query.CountAsync(ct);
            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<Violation?> GetViolationDetailsForManagerAsync(int id, int? marketId, CancellationToken ct = default)
        {
            if (marketId == null) return null;

            return await _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .Include(v => v.Requests)
                .AsNoTracking()
                .FirstOrDefaultAsync(v =>
                    v.ViolationId == id && v.Stall.Area.MarketId == marketId.Value,
                    ct);
        }

        public async Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default)
        {
            var violation = await _context.Violations
                .Include(v => v.Requests)
                .FirstOrDefaultAsync(v => v.ViolationId == violationId, ct);
                
            if (violation == null) return false;

            // Enforce that a violation can only be appealed once
            bool alreadyAppealed = violation.Requests.Any(r => r.RequestType == "ViolationAppeal");
            if (alreadyAppealed)
            {
                return false;
            }

            violation.Status = "Appealed";
            violation.UpdatedAt = DateTime.UtcNow;

            var vendor = await _context.Vendors.FirstOrDefaultAsync(ct);
            int vendorId = vendor != null ? vendor.VendorId : 1;

            var request = new Request
            {
                VendorId = vendorId,
                StallId = violation.StallId,
                RequestType = "ViolationAppeal",
                ViolationId = violationId,
                Title = $"Kháng nghị biên bản vi phạm #VIO-{violationId}",
                Description = "Đây là nội dung kháng nghị giả lập để kiểm thử tính năng duyệt/từ chối kháng nghị của Quản lý. Vui lòng xem xét các minh chứng đính kèm và phê duyệt.",
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Requests.Add(request);
            await _context.SaveChangesAsync(ct);
            return true;
        }

        public async Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsForVendorPagedAsync(
            int vendorId,
            int? stallId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var vendorContracts = _context.Contracts
                .Where(c => c.VendorId == vendorId && c.IsDeleted != true);

            var query = _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .Where(v => vendorContracts.Any(c => 
                    c.StallId == v.StallId &&
                    v.CreatedAt != null && 
                    c.StartDate <= DateOnly.FromDateTime(v.CreatedAt.Value) &&
                    c.EndDate >= DateOnly.FromDateTime(v.CreatedAt.Value)
                ))
                .AsQueryable();

            if (stallId.HasValue)
            {
                query = query.Where(v => v.StallId == stallId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var trimmedStatus = status.Trim();
                query = query.Where(v => v.Status == trimmedStatus);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(v => v.Title.ToLower().Contains(term)
                                         || v.Description.ToLower().Contains(term)
                                         || v.Stall.Code.ToLower().Contains(term)
                                         || v.ViolationType.Name.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync(ct);

            query = sortDescending
                ? query.OrderByDescending(v => v.CreatedAt)
                : query.OrderBy(v => v.CreatedAt);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<Violation?> GetViolationDetailForVendorAsync(int id, int vendorId, CancellationToken ct = default)
        {
            var vendorContracts = _context.Contracts
                .Where(c => c.VendorId == vendorId && c.IsDeleted != true);

            return await _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .Include(v => v.Requests)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.ViolationId == id && 
                    vendorContracts.Any(c => 
                        c.StallId == v.StallId &&
                        v.CreatedAt != null && 
                        c.StartDate <= DateOnly.FromDateTime(v.CreatedAt.Value) &&
                        c.EndDate >= DateOnly.FromDateTime(v.CreatedAt.Value)
                    ), ct);
        }

        public async Task<decimal> GetTotalFinesAsync(DateTime startDate, DateTime endDate, int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Violations.Where(v => v.CreatedAt >= startDate && v.CreatedAt < endDate && v.Status != "Approved");
            if (marketId.HasValue)
            {
                query = query.Where(v => v.Stall.Area.MarketId == marketId.Value);
            }
            return await query.SumAsync(v => (decimal)(v.FineAmount ?? 0), ct);
        }

        public async Task<IEnumerable<Violation>> GetAllViolationsWithDetailsAsync(int? marketId = null, CancellationToken ct = default)
        {
            var query = _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .AsQueryable();

            if (marketId.HasValue)
            {
                query = query.Where(v => v.Stall.Area.MarketId == marketId.Value);
            }

            return await query
                .OrderByDescending(v => v.ViolationId)
                .ToListAsync(ct);
        }

        public async Task<bool> IsViolationTypeInUseAsync(int violationTypeId, CancellationToken ct = default)
        {
            return await _context.Violations.AnyAsync(v => v.ViolationTypeId == violationTypeId, ct);
        }

        public async Task<List<Violation>> GetUnpaidViolationsByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.ViolationType)
                .Where(v => v.StallId == stallId && v.Status == "Unpaid")
                .ToListAsync(ct);
        }
    }
}
