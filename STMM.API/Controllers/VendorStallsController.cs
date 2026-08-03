using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Linq;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/vendor/stalls")]
    [Authorize]
    public class VendorStallsController : ControllerBase
    {
        private readonly IVendorServiceManagement _vendorServiceManagement;
        private readonly IVendorRepository _vendorRepository;

        public VendorStallsController(IVendorServiceManagement vendorServiceManagement, IVendorRepository vendorRepository)
        {
            _vendorServiceManagement = vendorServiceManagement;
            _vendorRepository = vendorRepository;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyStalls(CancellationToken ct)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized();
            }

            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId, ct);
            var vendor = vendors.FirstOrDefault();
            if (vendor == null)
            {
                return BadRequest("Vendor không tồn tại.");
            }

            var vendorId = vendor.VendorId;

            var stalls = await _vendorServiceManagement.GetMyStallsAsync(vendorId, ct);
            
            // Map to the specific anonymous object shape expected by the frontend
            var result = stalls.Select(s => new {
                StallId = s.StallId,
                Code = s.Code
            });

            return Ok(result);
        }
    }
}
