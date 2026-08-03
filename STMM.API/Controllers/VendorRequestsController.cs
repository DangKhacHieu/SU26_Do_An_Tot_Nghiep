using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Request;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Linq;

namespace STMM.API.Controllers
{
    [Route("api/vendor/requests")]
    [ApiController]
    [Authorize(Roles = "Vendor")]
    public class VendorRequestsController : ControllerBase
    {
        private readonly IVendorRequestService _vendorRequestService;
        private readonly IVendorRepository _vendorRepository;
        private readonly IAuditLogService _auditLogService;

        public VendorRequestsController(
            IVendorRequestService vendorRequestService, 
            IVendorRepository vendorRepository,
            IAuditLogService auditLogService)
        {
            _vendorRequestService = vendorRequestService;
            _vendorRepository = vendorRepository;
            _auditLogService = auditLogService;
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

        private int GetUserId()
        {
            var userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return 0;
            }
            return userId;
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

                // Ghi nhật ký hoạt động
                var userId = GetUserId();
                var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
                await _auditLogService.LogAsync(userId, $"Tạo yêu cầu mới: {dto.RequestType} - Sạp ID: {dto.StallId}", ipAddress);

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

                // Ghi nhật ký hoạt động
                var userId = GetUserId();
                var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
                await _auditLogService.LogAsync(userId, $"Hủy yêu cầu dịch vụ/sự cố (Yêu cầu ID: {id})", ipAddress);

                return Ok(new { message = "Yêu cầu đã được hủy thành công." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/resolve-quote")]
        public async Task<IActionResult> ResolveQuote(int id, [FromBody] STMM.Business.DTOs.Request.VendorQuotationDecisionRequest decision)
        {
            try
            {
                var validator = new STMM.Business.Validators.VendorQuotationDecisionValidator();
                var validationResult = await validator.ValidateAsync(decision);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.Errors.First().ErrorMessage });
                }

                var vendorId = await GetVendorIdAsync();
                var result = await _vendorRequestService.ResolveRequestQuoteForVendorAsync(vendorId, id, decision);

                // Ghi nhật ký hoạt động
                var userId = GetUserId();
                var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
                var choiceVerb = decision.IsApproved ? "Phê duyệt" : "Từ chối";
                await _auditLogService.LogAsync(userId, $"{choiceVerb} báo giá dịch vụ (Yêu cầu ID: {id})", ipAddress);

                return Ok(new { message = "Thao tác thành công.", data = result });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
