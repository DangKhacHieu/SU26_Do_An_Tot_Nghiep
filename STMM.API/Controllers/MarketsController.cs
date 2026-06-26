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
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<MarketDto>>> GetAllMarkets()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;

            // If authenticated, filter by role (Manager sees only their market)
            // If anonymous (public homepage/header), return all markets
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int userId))
            {
                var markets = await _marketService.GetAllMarketsAsync(userId, roleClaim ?? "");
                return Ok(markets);
            }
            else
            {
                // Anonymous: return all active markets for public display
                var markets = await _marketService.GetAllMarketsAsync(0, "");
                return Ok(markets);
            }
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

        [HttpPut("{marketId}/status")]
        // [Authorize(Roles = "Admin")] // Uncomment if you want to restrict to Admin
        public async Task<ActionResult> ChangeStatus(int marketId, [FromBody] string status)
        {
            var result = await _marketService.ChangeMarketStatusAsync(marketId, status);
            if (!result) return NotFound(new { message = "Market not found" });
            return Ok(new { message = "Market status updated successfully" });
        }

        [HttpPut("{marketId}/deactivate")]
        // [Authorize(Roles = "Manager")]
        public async Task<ActionResult> DeactivateMarket(int marketId)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int managerId))
                {
                    return Unauthorized(new { message = "User ID not found in token." });
                }

                var result = await _marketService.DeactivateMarketAsync(marketId, managerId);
                return Ok(new { message = "Market deactivated successfully. You can now create a new layout." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}