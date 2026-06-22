using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Meter;

namespace STMM.Business.Interfaces
{
    public interface IMeterService
    {
        Task<PagedResult<MeterDto>> GetMetersAsync(MeterQueryParameters queryParams, CancellationToken ct = default);
        Task<MeterDto?> GetMeterByIdAsync(int id, CancellationToken ct = default);
        Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, CancellationToken ct = default);
        Task<MeterDto> UpdateMeterAsync(int id, UpdateMeterRequest request, CancellationToken ct = default);
        Task<bool> DeleteMeterAsync(int id, CancellationToken ct = default);
        Task<bool> ReplaceMeterAsync(MeterReplacementRequest request, CancellationToken ct = default);
        Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, CancellationToken ct = default);
    }
}
