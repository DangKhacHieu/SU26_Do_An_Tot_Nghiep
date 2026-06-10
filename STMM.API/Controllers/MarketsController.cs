using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.Interfaces;
using STMM.Business.DTOs.Market;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MarketsController : ControllerBase
    {
        private readonly IMarketService _marketService;

        public MarketsController(IMarketService marketService)
        {
            _marketService = marketService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<MarketDto>>> GetAllMarkets()
        {
            var markets = await _marketService.GetAllMarketsAsync();
            return Ok(markets);
        }

        [HttpGet("{marketId}/map")]
        public async Task<ActionResult<MarketMapDto>> GetMarketMap(int marketId)
        {
            var marketMap = await _marketService.GetMarketMapAsync(marketId);
            if (marketMap == null)
            {
                return NotFound(new { message = "Market not found" });
            }

            return Ok(marketMap);
        }
    }
}