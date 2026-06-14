using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.DTOs.Stall;

namespace STMM.Business.Interfaces
{
    public interface IStallService
    {
        Task<IEnumerable<StallDto>> GetAllStallsByAreaIdAsync(int areaId);
        Task<StallDto?> GetStallByIdAsync(int id);
        Task<StallDto> CreateStallAsync(CreateStallDto createStallDto);
        Task<StallDto> UpdateStallAsync(int id, UpdateStallDto updateStallDto);
        Task<StallDto> UpdateStallLocationAsync(int id, UpdateStallLocationDto locationDto);
        Task<StallDto> UpdateStallStatusAsync(int id, string status);
        Task<bool> DeactivateStallAsync(int id);
    }
}
