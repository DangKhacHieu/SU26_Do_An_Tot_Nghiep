using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Stall;

namespace STMM.Business.Interfaces
{
    public interface IContractService
    {
        Task<IEnumerable<ContractDto>> GetContractsAsync(string? search, string? status, CancellationToken ct);
        Task<ContractDto?> GetContractByIdAsync(int contractId, CancellationToken ct);
        Task<ContractDto> CreateContractAsync(CreateContractRequest request, CancellationToken ct);
        Task<ContractDto> RenewContractAsync(int contractId, RenewContractRequest request, CancellationToken ct);
        Task<ContractDto> TerminateContractAsync(int contractId, CancellationToken ct);
        Task<IEnumerable<ContractVendorDto>> GetContractVendorsAsync(CancellationToken ct);
        Task<IEnumerable<StallDto>> GetAvailableStallsAsync(CancellationToken ct);
        Task<ContractDto> AttachSignedFilesAsync(int contractId, AttachContractFilesRequest request, CancellationToken ct);
        Task<ContractDto> UpdateContractVendorInfoAsync(int contractId, UpdateContractVendorInfoRequest request, CancellationToken ct);
    }
}
