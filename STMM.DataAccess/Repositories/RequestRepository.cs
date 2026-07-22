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
    public class RequestRepository : BaseRepository<Request>, IRequestRepository
    {
        public RequestRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<(IEnumerable<Request> Items, int TotalCount)> GetRequestsPagedAsync(
            int? vendorId,
            int? stallId,
            string? status,
            string? requestType,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default)
        {
            var query = _context.Requests
                .Include(r => r.Stall)
                .Include(r => r.Vendor)
                    .ThenInclude(v => v.User)
                .AsQueryable();

            if (vendorId.HasValue)
            {
                query = query.Where(r => r.VendorId == vendorId.Value);
            }

            if (stallId.HasValue)
            {
                query = query.Where(r => r.StallId == stallId.Value);
            }

            if (!string.IsNullOrWhiteSpace(status))
            {
                var trimmedStatus = status.Trim();
                query = query.Where(r => r.Status == trimmedStatus);
            }

            if (!string.IsNullOrWhiteSpace(requestType))
            {
                var trimmedType = requestType.Trim();
                query = query.Where(r => r.RequestType == trimmedType);
            }

            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                var term = searchTerm.Trim().ToLower();
                query = query.Where(r => r.Title.ToLower().Contains(term)
                                         || r.Description.ToLower().Contains(term)
                                         || r.Stall.Code.ToLower().Contains(term)
                                         || r.Vendor.User.Name.ToLower().Contains(term)
                                         || r.Vendor.BusinessName.ToLower().Contains(term));
            }

            var totalCount = await query.CountAsync(ct);

            query = sortDescending
                ? query.OrderByDescending(r => r.CreatedAt)
                : query.OrderBy(r => r.CreatedAt);

            var items = await query
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .AsNoTracking()
                .ToListAsync(ct);

            return (items, totalCount);
        }

        public async Task<Request?> GetRequestWithRelationsAsync(int requestId, CancellationToken ct = default)
        {
            return await _context.Requests
                .Include(r => r.Stall)
                .Include(r => r.Vendor)
                    .ThenInclude(v => v.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.RequestId == requestId, ct);
        }

        public Task<Request?> GetRequestWithRelationsForMarketAsync(
            int requestId,
            int marketId,
            CancellationToken ct = default)
        {
            return _context.Requests
                .Include(r => r.Stall)
                    .ThenInclude(s => s.Area)
                .Include(r => r.Vendor)
                    .ThenInclude(v => v.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(r =>
                    r.RequestId == requestId &&
                    r.Stall.Area.MarketId == marketId,
                    ct);
        }

        public async Task<Request?> ApproveOrRejectAppealAsync(int requestId, bool isApproved, CancellationToken ct = default)
        {
            var request = await _context.Requests
                .Include(r => r.Violation)
                .FirstOrDefaultAsync(r => r.RequestId == requestId, ct);

            if (request == null || request.RequestType != "ViolationAppeal")
            {
                return null;
            }

            request.Status = isApproved ? "Approved" : "Rejected";
            request.UpdatedAt = DateTime.UtcNow;

            if (request.Violation != null)
            {
                request.Violation.Status = isApproved ? "Approved" : "Rejected";
                request.Violation.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync(ct);
            return request;
        }
    }
}
