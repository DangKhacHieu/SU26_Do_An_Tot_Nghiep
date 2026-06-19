using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Request;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [Route("api/vendor/requests")]
    [ApiController]
    [Authorize(Roles = "Vendor")]
    public class VendorRequestsController : ControllerBase
    {
        private readonly IVendorRequestService _vendorRequestService;
        private readonly IVendorRepository _vendorRepository;

        public VendorRequestsController(IVendorRequestService vendorRequestService, STMM.DataAccess.IRepositories.IVendorRepository vendorRepository)
        {
            _vendorRequestService = vendorRequestService;
            _vendorRepository = vendorRepository;
        }

        private async Task<int> GetVendorIdAsync()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID is not found in the token.");
            }

            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId);
            var vendor = System.Linq.Enumerable.FirstOrDefault(vendors);
            if (vendor == null)
            {
                throw new System.UnauthorizedAccessException("Vendor profile not found for this user.");
            }
            return vendor.VendorId;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyRequests([FromQuery] RequestQueryParams queryParams)
        {
            try
            {
                var vendorId = await GetVendorIdAsync();
                var result = await _vendorRequestService.GetMyRequestsAsync(vendorId, queryParams);
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestDetail(int id)
        {
            try
            {
                var vendorId = await GetVendorIdAsync();
                var result = await _vendorRequestService.GetRequestDetailAsync(vendorId, id);
                if (result == null)
                {
                    return NotFound(new { message = "Yêu cầu không tồn tại hoặc bạn không có quyền xem." });
                }
                return Ok(result);
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateRequest([FromBody] CreateRequestDto dto)
        {
            try
            {
                var vendorId = await GetVendorIdAsync();
                var result = await _vendorRequestService.CreateRequestAsync(vendorId, dto);
                return Ok(new { message = "Tạo yêu cầu thành công.", data = result });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/cancel")]
        public async Task<IActionResult> CancelRequest(int id)
        {
            try
            {
                var vendorId = await GetVendorIdAsync();
                await _vendorRequestService.CancelRequestAsync(vendorId, id);
                return Ok(new { message = "Đã hủy yêu cầu thành công." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
