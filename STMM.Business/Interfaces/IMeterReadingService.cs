using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Meter;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IMeterReadingService
    {
        Task<PagedResult<MeterReadingDto>> GetReadingsByStallIdAsync(int stallId, MeterReadingQueryParams query, CancellationToken ct = default);
        Task<MeterDto> GetMeterByIdAsync(int meterId, CancellationToken ct = default);
        Task<IEnumerable<MeterDto>> GetMetersByStallIdAsync(int stallId, CancellationToken ct = default);
        Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, CancellationToken ct = default);
        Task<MeterReadingDto> CreateReadingAsync(int userId, CreateMeterReadingRequest request, CancellationToken ct = default);
    }
}
