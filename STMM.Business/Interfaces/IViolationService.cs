using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;

namespace STMM.Business.Interfaces
{
    public interface IViolationService
    {
        Task<PagedResult<ViolationDto>> GetViolationsAsync(int userId, ViolationQueryParams queryParams, CancellationToken ct = default);
        Task<ViolationDto> GetViolationByIdAsync(int id, int userId, CancellationToken ct = default);
        Task<ViolationDto> CreateViolationAsync(int userId, CreateViolationRequest request, CancellationToken ct = default);
        Task<IEnumerable<ViolationTypeDto>> GetViolationTypesAsync(CancellationToken ct = default);
    }
}
