using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.DTOs.Market;

namespace STMM.Business.Interfaces
{
    public interface IMarketService
    {
        Task<IEnumerable<MarketDto>> GetAllMarketsAsync();
        Task<MarketMapDto?> GetMarketMapAsync(int marketId);
    }
}
