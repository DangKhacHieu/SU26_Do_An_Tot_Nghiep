using System.Security.Claims;

namespace STMM.API.Extensions
{
    public static class ClaimsExtensions
    {
        public static int? GetUserId(this ClaimsPrincipal principal)
        {
            var userIdClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? principal.FindFirst("userId")?.Value;
            if (int.TryParse(userIdClaim, out var userId))
            {
                return userId;
            }
            return null;
        }

        public static int? GetMarketId(this ClaimsPrincipal principal)
        {
            var marketIdClaim = principal.FindFirst("MarketId")?.Value;
            if (int.TryParse(marketIdClaim, out var marketId))
            {
                return marketId;
            }
            return null;
        }
    }
}
