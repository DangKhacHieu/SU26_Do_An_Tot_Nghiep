using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/vendor/stalls")]
    [Authorize]
    public class VendorStallsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorStallsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyStalls()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var stalls = await _context.Contracts
                .Where(c => c.Vendor.UserId == userId && c.Status == "Active" && c.IsDeleted != true)
                .Include(c => c.Stall)
                .Select(c => new { 
                    StallId = c.Stall.StallId,
                    Code = c.Stall.Code
                })
                .Distinct()
                .ToListAsync();

            return Ok(stalls);
        }
    }
}
