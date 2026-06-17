using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Request;

namespace STMM.Business.Interfaces
{
    public interface IRequestService
    {
        Task<PagedResult<RequestDto>> GetRequestsForManagerAsync(RequestQueryParams queryParams, CancellationToken ct = default);
        Task<RequestDto> GetRequestByIdForManagerAsync(int id, CancellationToken ct = default);
        Task<RequestDto> ResolveViolationAppealAsync(int requestId, bool approve, CancellationToken ct = default);
    }
}
