using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Meter;

namespace STMM.Business.Interfaces
{
    public interface IMeterService
    {
        Task<IReadOnlyList<MeterDto>> GetMetersAsync(int userId, CancellationToken ct = default);
        Task<MeterDto?> GetMeterByIdAsync(int id, int userId, CancellationToken ct = default);
        Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, int userId, CancellationToken ct = default);
        Task<MeterDto> UpdateMeterAsync(int id, int userId, UpdateMeterRequest request, CancellationToken ct = default);

        Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, int userId, CancellationToken ct = default);
    }
}
