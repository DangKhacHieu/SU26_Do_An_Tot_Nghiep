using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.DTOs.Market;

namespace STMM.Business.Interfaces
{
    public interface IMarketService
    {
        Task<IEnumerable<MarketDto>> GetAllMarketsAsync(int currentUserId, string currentUserRole);
        Task<MarketMapDto?> GetMarketMapAsync(int marketId);
        Task<MarketMapDto> GetMarketMapForStaffAsync(int staffUserId);
        Task<MarketDto> CreateMarketBulkAsync(CreateMarketBulkRequest request, int currentUserId);
        Task<bool> DeleteMarketAsync(int marketId);
        Task<bool> ChangeMarketStatusAsync(int marketId, string status);
        Task<bool> DeactivateMarketAsync(int marketId, int managerId);
    }
}
