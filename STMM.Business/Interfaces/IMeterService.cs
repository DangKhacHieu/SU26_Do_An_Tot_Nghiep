using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Meter;

namespace STMM.Business.Interfaces
{
    public interface IMeterService
    {
        Task<IReadOnlyList<MeterDto>> GetMetersAsync(int userId, CancellationToken ct = default);
        Task<MeterDto?> GetMeterByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default);
        Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, int userId, CancellationToken ct = default);
        Task<MeterDto> UpdateMeterAsync(int id, UpdateMeterRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<bool> DeleteMeterAsync(int id, int? currentUserId = null, CancellationToken ct = default);

        Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, int userId, CancellationToken ct = default);
        Task<IEnumerable<MeterDto>> GetMetersByStallIdAsync(int userId, int stallId, CancellationToken ct = default);
    }
}
