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

        public async Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedAsync(
            int userId,
            string? status,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Violations
                .Include(v => v.Stall)
                .Where(v => v.CreatedByUserId == userId);

            if (!string.IsNullOrWhiteSpace(status))
            {
                query = query.Where(v => v.Status == status);
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

        public async Task<Violation?> GetViolationWithStallAsync(int id, int userId, CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.Stall)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.ViolationId == id && v.CreatedByUserId == userId, ct);
        }

        public async Task<(IEnumerable<Violation> Items, int TotalCount)> GetViolationsPagedForManagerAsync(
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .AsQueryable();

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
                                         || v.ViolationType.Name.ToLower().Contains(term)
                                         || (v.CreatedByUser != null && v.CreatedByUser.Name.ToLower().Contains(term)));
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

        public async Task<Violation?> GetViolationDetailsForManagerAsync(int id, CancellationToken ct = default)
        {
            return await _context.Violations
                .Include(v => v.Stall)
                .Include(v => v.ViolationType)
                .Include(v => v.CreatedByUser)
                .Include(v => v.Requests)
                .AsNoTracking()
                .FirstOrDefaultAsync(v => v.ViolationId == id, ct);
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
    }
}
