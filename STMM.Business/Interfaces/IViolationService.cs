using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;

namespace STMM.Business.Interfaces
{
    public interface IViolationService
    {
        Task<PagedResult<ViolationDto>> GetViolationsAsync(int userId, ViolationQueryParams queryParams, CancellationToken ct = default);
        Task<ViolationDto> GetViolationByIdAsync(int id, int userId, CancellationToken ct = default);
        Task<ViolationDto> CreateViolationAsync(int userId, CreateViolationRequest request, CancellationToken ct = default);
        
        // Active violation types
        Task<IEnumerable<ViolationTypeDto>> GetViolationTypesAsync(CancellationToken ct = default);
        Task<PagedResult<ViolationDto>> GetViolationsForManagerAsync(ViolationQueryParams queryParams, CancellationToken ct = default);
        Task<ViolationDto> GetViolationByIdForManagerAsync(int id, CancellationToken ct = default);
        Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default);
        
        // General query for Accountant role (all violations across the system)
        Task<IEnumerable<ViolationDto>> GetAllViolationsAsync(int? accountantUserId = null, CancellationToken ct = default);

        // CRUD for Violation Types
        Task<IEnumerable<ViolationTypeDto>> GetAllViolationTypesWithInactiveAsync(CancellationToken ct = default);
        Task<ViolationTypeDto> CreateViolationTypeAsync(CreateViolationTypeRequest request, CancellationToken ct = default);
        Task<ViolationTypeDto> UpdateViolationTypeAsync(int id, UpdateViolationTypeRequest request, CancellationToken ct = default);
        Task<bool> DeleteViolationTypeAsync(int id, CancellationToken ct = default);
    }
}
