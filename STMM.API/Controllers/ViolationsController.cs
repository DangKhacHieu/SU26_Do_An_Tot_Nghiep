using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Violation;
using STMM.Business.Interfaces;
using System.Security.Claims;
using STMM.API.Extensions;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/violations")]
    [Authorize]
    public class ViolationsController : ControllerBase
    {
        private readonly IViolationService _violationService;
        private readonly IAuditLogService _auditLogService;

        public ViolationsController(IViolationService violationService, IAuditLogService auditLogService)
        {
            _violationService = violationService;
            _auditLogService = auditLogService;
        }

        private int GetUserId()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                throw new System.UnauthorizedAccessException("User ID not found in token.");
            }
            return userId.Value;
        }

        [HttpGet]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> GetViolations(
            CancellationToken ct)
        {
            var result = await _violationService.GetViolationsAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> GetViolationById(
            int id,
            CancellationToken ct)
        {
            var result = await _violationService.GetViolationByIdAsync(id, GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> CreateViolation(
            [FromBody] CreateViolationRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _violationService.CreateViolationAsync(userId, request, ct);

            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Lập biên bản vi phạm: {result.ViolationTypeName} - Sạp: {result.StallCode} - Số tiền phạt: {request.FineAmount:N0} VNĐ", ipAddress, ct);

            return CreatedAtAction(nameof(GetViolationById), new { id = result.ViolationId }, result);
        }

        /// <summary>
        /// Get Violation Types — Lấy danh sách loại vi phạm đang hoạt động.
        /// </summary>
        [HttpGet("types")]
        [Authorize(Roles = "Staff,Manager,Accountant,Admin")]
        public async Task<IActionResult> GetViolationTypes(CancellationToken ct)
        {
            var result = await _violationService.GetViolationTypesAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpGet("~/api/manager/violations")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetViolationsForManager(
            [FromQuery] ViolationQueryParams queryParams,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _violationService.GetViolationsForManagerAsync(managerUserId, queryParams, ct);
            return Ok(result);
        }

        // --- ACCOUNTANT / GENERAL ADDITIONS ---

        /// <summary>
        /// Lấy toàn bộ danh sách biên bản vi phạm của toàn hệ thống (tra cứu nộp phạt).
        /// </summary>
        [HttpGet("all")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> GetAllViolations(CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _violationService.GetAllViolationsAsync(userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Tạo hóa đơn cho biên bản vi phạm.
        /// </summary>
        [HttpPost("{id}/invoice")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> CreateInvoiceForViolation(int id, CancellationToken ct)
        {
            var userId = GetUserId();
            var success = await _violationService.CreateInvoiceForViolationAsync(id, userId, ct);
            if (!success) return BadRequest(new { message = "Không thể tạo hóa đơn cho vi phạm này." });

            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Tạo hóa đơn cho biên bản vi phạm (ID: {id})", ipAddress, ct);

            return Ok(new { message = "Tạo hóa đơn phạt thành công!" });
        }

        /// <summary>
        /// UC-xx: View Violation Details for Manager — Manager xem chi tiết vi phạm.
        /// </summary>
        [HttpGet("~/api/manager/violations/{id:int}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetViolationByIdForManager(
            int id,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _violationService.GetViolationByIdForManagerAsync(managerUserId, id, ct);
            return Ok(result);
        }
        /// <summary>
        /// UC-xx: Finalize Violation for Manager — Manager chốt vi phạm.
        /// </summary>
        [HttpPost("~/api/manager/violations/{id:int}/finalize")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> FinalizeViolation(int id, CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var success = await _violationService.FinalizeViolationAsync(managerUserId, id, ct);
            if (!success) return BadRequest(new { message = "Không thể chốt biên bản vi phạm này." });

            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(managerUserId, $"Chốt quyết định cuối cùng cho biên bản vi phạm (ID: {id})", ipAddress, ct);

            return Ok(new { message = "Chốt vi phạm thành công!" });
        }

        /// <summary>
        /// Lấy toàn bộ danh sách Loại vi phạm (kèm cả loại đã ẩn).
        /// </summary>
        [HttpGet("types/all")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> GetAllViolationTypes(CancellationToken ct)
        {
            var result = await _violationService.GetAllViolationTypesWithInactiveAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost("~/api/manager/violations/{id:int}/simulate-appeal")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> SimulateAppeal(int id, CancellationToken ct)
        {
            var result = await _violationService.SimulateViolationAppealAsync(id, ct);
            if (!result) return BadRequest(new { message = "Biên bản vi phạm này đã được kháng nghị trước đó hoặc không tồn tại." });
            return Ok(new { message = "Simulated appeal created successfully." });
        }

        /// <summary>
        /// Tạo loại vi phạm mới.
        /// </summary>
        [HttpPost("types")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> CreateViolationType([FromBody] CreateViolationTypeRequest request, CancellationToken ct)
        {
            var result = await _violationService.CreateViolationTypeAsync(GetUserId(), request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Tạo loại vi phạm mới: {result.Name} - Mức phạt mặc định: {result.DefaultFine:N0} VNĐ", ipAddress, ct);

            return Ok(result);
        }

        /// <summary>
        /// Cập nhật loại vi phạm.
        /// </summary>
        [HttpPut("types/{id}")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> UpdateViolationType(int id, [FromBody] UpdateViolationTypeRequest request, CancellationToken ct)
        {
            var result = await _violationService.UpdateViolationTypeAsync(id, request, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật loại vi phạm (ID: {id}) - Tên: {result.Name}", ipAddress, ct);

            return Ok(result);
        }

        /// <summary>
        /// Xóa (Ẩn hoạt động) loại vi phạm.
        /// </summary>
        [HttpDelete("types/{id}")]
        [Authorize(Roles = "Accountant,Admin")]
        public async Task<IActionResult> DeleteViolationType(int id, CancellationToken ct)
        {
            var result = await _violationService.DeleteViolationTypeAsync(id, ct);

            // Ghi nhật ký hoạt động
            var userId = GetUserId();
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Xóa/Ẩn loại vi phạm (ID: {id})", ipAddress, ct);

            return Ok(result);
        }
    }
}

