using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Service;
using STMM.Business.DTOs.Stall;

namespace STMM.Business.Interfaces;

public interface IVendorServiceManagement
{
    Task<int> GetVendorIdByUserIdAsync(int userId, CancellationToken ct = default);
    Task<IEnumerable<ServiceDto>> GetAvailableServicesAsync(int vendorId, CancellationToken ct = default);
    Task<IEnumerable<ServiceRegistrationDto>> GetMyServicesAsync(int vendorId, CancellationToken ct = default);
    Task<IEnumerable<StallDto>> GetMyStallsAsync(int vendorId, CancellationToken ct = default);
    Task<ServiceRegistrationDto> GetServiceDetailAsync(int vendorId, int registrationId, CancellationToken ct = default);
    Task<ServiceRegistrationDto> RegisterServiceAsync(int vendorId, RegisterServiceRequest request, CancellationToken ct = default);
    Task CancelServiceAsync(int vendorId, int registrationId, CancellationToken ct = default);
    Task ReactivateServiceAsync(int vendorId, int registrationId, CancellationToken ct = default);
}
