using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Dashboard;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/config")]
    [Authorize(Roles = "Accountant,Admin")]
    public class FinancialConfigController : ControllerBase
    {
        private readonly IFinancialConfigService _configService;
        private readonly IAuditLogService _auditLogService;

        public FinancialConfigController(IFinancialConfigService configService, IAuditLogService auditLogService)
        {
            _configService = configService;
            _auditLogService = auditLogService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return 0;
            }
            return userId;
        }

        // --- FEE TYPES ---
        [HttpGet("fee-types")]
        public async Task<IActionResult> GetFeeTypes(CancellationToken ct)
        {
            var result = await _configService.GetFeeTypesAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost("fee-types")]
        public async Task<IActionResult> CreateFeeType([FromBody] CreateFeeTypeRequest request, CancellationToken ct)
        {
            var result = await _configService.CreateFeeTypeAsync(GetUserId(), request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Tạo loại phí mới: {result.Name} (ID: {result.FeeTypeId}) - Đơn vị: {result.Unit}", ipAddress, ct);

            return Ok(result);
        }

        [HttpPut("fee-types/{id}")]
        public async Task<IActionResult> UpdateFeeType(int id, [FromBody] UpdateFeeTypeRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateFeeTypeAsync(id, request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật loại phí: {result.Name} (ID: {id})", ipAddress, ct);

            return Ok(result);
        }

        [HttpDelete("fee-types/{id}")]
        public async Task<IActionResult> DeleteFeeType(int id, CancellationToken ct)
        {
            var result = await _configService.DeleteFeeTypeAsync(id, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Xóa loại phí (ID: {id})", ipAddress, ct);

            return Ok(result);
        }

        // --- SERVICES ---
        [HttpGet("services")]
        public async Task<IActionResult> GetServices(CancellationToken ct)
        {
            var result = await _configService.GetServicesAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost("services")]
        public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request, CancellationToken ct)
        {
            var result = await _configService.CreateServiceAsync(GetUserId(), request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Đăng ký dịch vụ tiện ích mới: {result.Name} (ID: {result.ServiceId}) - Giá: {result.Price:N0} VNĐ", ipAddress, ct);

            return Ok(result);
        }

        [HttpPut("services/{id}")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] UpdateServiceRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateServiceAsync(id, request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật dịch vụ tiện ích: {result.Name} (ID: {id})", ipAddress, ct);

            return Ok(result);
        }

        [HttpDelete("services/{id}")]
        public async Task<IActionResult> DeleteService(int id, CancellationToken ct)
        {
            var result = await _configService.DeleteServiceAsync(id, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Xóa dịch vụ tiện ích (ID: {id})", ipAddress, ct);

            return Ok(result);
        }

        // --- SYSTEM CONFIGS ---
        [HttpGet("system-configs")]
        public async Task<IActionResult> GetSystemConfigs(CancellationToken ct)
        {
            var result = await _configService.GetSystemConfigsAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpPut("system-configs")]
        public async Task<IActionResult> UpdateSystemConfig([FromBody] UpdateSystemConfigRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateSystemConfigAsync(GetUserId(), request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật cấu hình hệ thống: {request.ConfigKey} -> {request.ConfigValue}", ipAddress, ct);

            return Ok(result);
        }

        // --- TIERS ---
        [HttpGet("tiers/{utilityType}")]
        public async Task<IActionResult> GetTiers(string utilityType, CancellationToken ct)
        {
            var result = await _configService.GetTiersAsync(GetUserId(), utilityType, ct);
            return Ok(result);
        }

        [HttpPut("tiers")]
        public async Task<IActionResult> UpdateTiers([FromBody] UpdateTiersRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateTiersAsync(GetUserId(), request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật biểu phí lũy tiến cho khóa: {request.ConfigKey}", ipAddress, ct);

            return Ok(result);
        }
    }
}
