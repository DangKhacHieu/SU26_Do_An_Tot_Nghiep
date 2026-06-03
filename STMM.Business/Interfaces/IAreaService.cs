using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.DTOs.Area;

namespace STMM.Business.Interfaces
{
    public interface IAreaService
    {
        Task<IEnumerable<AreaDto>> GetAllAreasAsync(int? marketId = null);
        Task<AreaDto?> GetAreaByIdAsync(int id);
        Task<AreaDto> CreateAreaAsync(CreateAreaRequest request);
        Task<AreaDto> UpdateAreaAsync(int id, UpdateAreaRequest request);
        Task<bool> DeleteAreaAsync(int id);
    }
}
