using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IRequestRepository : IBaseRepository<Request>
    {
        Task<(IEnumerable<Request> Items, int TotalCount)> GetRequestsPagedAsync(
            string? status,
            string? requestType,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Request?> GetRequestWithRelationsAsync(int requestId, CancellationToken ct = default);
    }
}
