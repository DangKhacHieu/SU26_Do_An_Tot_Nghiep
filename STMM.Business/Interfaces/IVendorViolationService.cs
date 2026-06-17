using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;

namespace STMM.Business.Interfaces
{
    public interface IVendorViolationService
    {
        Task<PagedResult<ViolationDto>> GetMyViolationsAsync(int vendorId, ViolationQueryParams queryParams, CancellationToken ct = default);
        Task<ViolationDto?> GetViolationDetailAsync(int vendorId, int violationId, CancellationToken ct = default);
    }
}
