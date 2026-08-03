using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IRequestRepository : IBaseRepository<Request>
    {
        Task<(IEnumerable<Request> Items, int TotalCount)> GetRequestsPagedAsync(
            int? vendorId,
            int? stallId,
            string? status,
            string? requestType,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Request?> GetRequestWithRelationsAsync(int requestId, CancellationToken ct = default);
        Task<Request?> GetRequestWithRelationsAsync(int requestId, bool tracking, CancellationToken ct = default);

        Task<Request?> GetRequestWithRelationsForMarketAsync(
            int requestId,
            int marketId,
            CancellationToken ct = default);

        Task<Request?> ApproveOrRejectAppealAsync(int requestId, bool isApproved, CancellationToken ct = default);
        Task<List<Request>> GetInvoiceDisputesAsync(int? accountantMarketId = null, CancellationToken ct = default);
        Task<Request?> GetRequestWithStallAndVendorAsync(int requestId, CancellationToken ct = default);
    }
}
