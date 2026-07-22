using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Violation;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace STMM.API.Controllers
{
    [Route("api/vendor/violations")]
    [ApiController]
    [Authorize(Roles = "Vendor")]
    public class VendorViolationsController : ControllerBase
    {
        private readonly IVendorViolationService _vendorViolationService;
        private readonly IVendorRepository _vendorRepository;

        public VendorViolationsController(IVendorViolationService vendorViolationService, IVendorRepository vendorRepository)
        {
            _vendorViolationService = vendorViolationService;
            _vendorRepository = vendorRepository;
        }

        private async Task<int> GetVendorIdAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID is not found in the token.");
            }

            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId);
            var vendor = vendors.FirstOrDefault();
            if (vendor == null)
            {
                throw new System.UnauthorizedAccessException("Vendor profile not found for this user.");
            }

            return vendor.VendorId;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyViolations([FromQuery] ViolationQueryParams queryParams)
        {
            try
            {
                int vendorId = await GetVendorIdAsync();
                var result = await _vendorViolationService.GetMyViolationsAsync(vendorId, queryParams);
                return Ok(result);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetViolationDetail(int id)
        {
            try
            {
                int vendorId = await GetVendorIdAsync();
                var result = await _vendorViolationService.GetViolationDetailAsync(vendorId, id);
                if (result == null)
                {
                    return NotFound(new { message = "Không tìm thấy biên bản vi phạm hoặc bạn không có quyền xem." });
                }
                return Ok(result);
            }
            catch (System.ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (System.UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
