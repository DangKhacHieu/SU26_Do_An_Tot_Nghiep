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

        public VendorViolationsController(IVendorViolationService vendorViolationService)
        {
            _vendorViolationService = vendorViolationService;
        }

        private async Task<int> GetVendorIdAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID is not found in the token.");
            }

            return await _vendorViolationService.GetVendorIdByUserIdAsync(userId);
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
