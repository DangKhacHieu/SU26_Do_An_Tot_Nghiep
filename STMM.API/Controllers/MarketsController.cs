using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.Interfaces;
using STMM.Business.DTOs.Market;

using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { message = "User ID not found in token." });
            }

            var markets = await _marketService.GetAllMarketsAsync(userId, roleClaim ?? "");
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

        [HttpPost("bulk")]
        public async Task<ActionResult<MarketDto>> CreateMarketBulk([FromBody] CreateMarketBulkRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
                {
                    return Unauthorized(new { message = "User ID not found in token." });
                }

                var market = await _marketService.CreateMarketBulkAsync(request, userId);
                return Ok(market);
            }
            catch (System.Exception ex)
            {
                var msg = ex.Message;
                if (ex.InnerException != null) msg += " Inner: " + ex.InnerException.Message;
                return BadRequest(new { message = msg });
            }
        }

        [HttpDelete("{marketId}")]
        public async Task<ActionResult> DeleteMarket(int marketId)
        {
            var result = await _marketService.DeleteMarketAsync(marketId);
            if (!result) return NotFound(new { message = "Market not found" });
            return NoContent();
        }
    }
}