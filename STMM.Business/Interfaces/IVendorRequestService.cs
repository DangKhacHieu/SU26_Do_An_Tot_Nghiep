using System.Threading.Tasks;
using STMM.Business.DTOs.Request;
using STMM.Business.DTOs.Common;

namespace STMM.Business.Interfaces
{
    public interface IVendorRequestService
    {
        Task<int> GetVendorIdByUserIdAsync(int userId);
        Task<PagedResult<RequestDto>> GetMyRequestsAsync(int vendorId, RequestQueryParams queryParams);
        Task<RequestDto> GetRequestDetailAsync(int vendorId, int requestId);
        Task<RequestDto> CreateRequestAsync(int vendorId, CreateRequestDto dto);
        Task<bool> CancelRequestAsync(int vendorId, int requestId);
        Task<RequestDto> ResolveRequestQuoteForVendorAsync(int vendorId, int requestId, VendorQuotationDecisionRequest decision, CancellationToken ct = default);
    }
}
