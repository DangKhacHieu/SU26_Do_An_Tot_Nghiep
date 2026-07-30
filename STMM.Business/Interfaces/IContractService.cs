using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Stall;

namespace STMM.Business.Interfaces
{
    public interface IContractService
    {
        Task<IEnumerable<ContractDto>> GetContractsAsync(string? search, string? status, int? currentUserId = null, CancellationToken ct = default);
        Task<ContractDto?> GetContractByIdAsync(int contractId, int? currentUserId = null, CancellationToken ct = default);
        Task<ContractDto> CreateContractAsync(CreateContractRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<ContractDto> RenewContractAsync(int contractId, RenewContractRequest request, CancellationToken ct = default);
        Task<ContractDto> TerminateContractAsync(int contractId, DateOnly? terminationDate = null, int? currentUserId = null, CancellationToken ct = default);
        Task<IEnumerable<ContractVendorDto>> GetContractVendorsAsync(int? currentUserId = null, CancellationToken ct = default);
        Task<IEnumerable<StallDto>> GetAvailableStallsAsync(int? currentUserId = null, CancellationToken ct = default);
        Task<ContractDto> AttachSignedFilesAsync(int contractId, AttachContractFilesRequest request, CancellationToken ct);
        Task<ContractDto> UpdateContractVendorInfoAsync(int contractId, UpdateContractVendorInfoRequest request, CancellationToken ct);
    }
}
