using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Request;

namespace STMM.Business.Interfaces
{
    public interface IRequestService
    {
        Task<PagedResult<RequestDto>> GetRequestsForManagerAsync(RequestQueryParams queryParams, int? managerUserId = null, CancellationToken ct = default);
        Task<RequestDto> GetRequestByIdForManagerAsync(int id, int? managerUserId = null, CancellationToken ct = default);
        Task<RequestDto> ResolveViolationAppealAsync(int requestId, bool approve, CancellationToken ct = default);
        Task<RequestDto> ResolveRequestQuotationAsync(
            int requestId,
            int managerUserId,
            ManagerQuotationDecisionRequest decision,
            CancellationToken ct = default);
    }
}
