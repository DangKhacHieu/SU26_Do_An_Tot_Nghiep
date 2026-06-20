using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Dashboard;

namespace STMM.Business.Interfaces
{
    public interface IFinancialConfigService
    {
        // Fee Types
        Task<IEnumerable<FeeTypeDto>> GetFeeTypesAsync(CancellationToken ct = default);
        Task<FeeTypeDto> CreateFeeTypeAsync(CreateFeeTypeRequest request, CancellationToken ct = default);
        Task<FeeTypeDto> UpdateFeeTypeAsync(int id, UpdateFeeTypeRequest request, CancellationToken ct = default);
        Task<bool> DeleteFeeTypeAsync(int id, CancellationToken ct = default);

        // Services
        Task<IEnumerable<ServiceDto>> GetServicesAsync(CancellationToken ct = default);
        Task<ServiceDto> CreateServiceAsync(CreateServiceRequest request, CancellationToken ct = default);
        Task<ServiceDto> UpdateServiceAsync(int id, UpdateServiceRequest request, CancellationToken ct = default);
        Task<bool> DeleteServiceAsync(int id, CancellationToken ct = default);

        // System Configs
        Task<IEnumerable<SystemConfigDto>> GetSystemConfigsAsync(CancellationToken ct = default);
        Task<bool> UpdateSystemConfigAsync(UpdateSystemConfigRequest request, CancellationToken ct = default);

        // Tiers (Electricity & Water)
        Task<List<UtilityTierStep>> GetTiersAsync(string configKey, CancellationToken ct = default);
        Task<bool> UpdateTiersAsync(UpdateTiersRequest request, CancellationToken ct = default);
    }
}
