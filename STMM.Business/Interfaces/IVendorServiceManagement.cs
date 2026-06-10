using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Service;

namespace STMM.Business.Interfaces;

public interface IVendorServiceManagement
{
    Task<IEnumerable<ServiceDto>> GetAvailableServicesAsync(int vendorId, CancellationToken ct = default);
    Task<IEnumerable<ServiceRegistrationDto>> GetMyServicesAsync(int vendorId, CancellationToken ct = default);
    Task<ServiceRegistrationDto> RegisterServiceAsync(int vendorId, RegisterServiceRequest request, CancellationToken ct = default);
    Task CancelServiceAsync(int vendorId, int registrationId, CancellationToken ct = default);
}
