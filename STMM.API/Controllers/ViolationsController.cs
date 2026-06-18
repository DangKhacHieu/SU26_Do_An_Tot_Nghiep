using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Violation;
using STMM.Business.Interfaces;
using System.Security.Claims;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/violations")]
    [Authorize(Roles = "Staff")]
    public class ViolationsController : ControllerBase
    {
        private readonly IViolationService _violationService;

        public ViolationsController(IViolationService violationService)
        {
            _violationService = violationService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID not found in token.");
            }
            return userId;
        }

        /// <summary>
        /// UC-54: View Violation List — Staff xem danh sách vi phạm do mình tạo.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetViolations(
            [FromQuery] int userId,
            [FromQuery] ViolationQueryParams queryParams,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _violationService.GetViolationsAsync(userId, queryParams, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-56: View Violation Details — Staff xem chi tiết một vi phạm.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetViolationById(
            int id,
            [FromQuery] int userId,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _violationService.GetViolationByIdAsync(id, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-55: Create Violation Report — Staff lập biên bản vi phạm mới.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateViolation(
            [FromQuery] int userId,
            [FromBody] CreateViolationRequest request,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _violationService.CreateViolationAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetViolationById), new { id = result.ViolationId, userId }, result);
        }

        /// <summary>
        /// Get Violation Types — Lấy danh sách loại vi phạm đang hoạt động.
        /// </summary>
        [HttpGet("types")]
        public async Task<IActionResult> GetViolationTypes(CancellationToken ct)
        {
            var result = await _violationService.GetViolationTypesAsync(ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: View Violations List for Manager — Manager xem tất cả vi phạm.
        /// </summary>
        [HttpGet("~/api/manager/violations")]
        public async Task<IActionResult> GetViolationsForManager(
            [FromQuery] ViolationQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _violationService.GetViolationsForManagerAsync(queryParams, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: View Violation Details for Manager — Manager xem chi tiết vi phạm.
        /// </summary>
        [HttpGet("~/api/manager/violations/{id:int}")]
        public async Task<IActionResult> GetViolationByIdForManager(
            int id,
            CancellationToken ct)
        {
            var result = await _violationService.GetViolationByIdForManagerAsync(id, ct);
            return Ok(result);
        }

        /// <summary>
        /// Mock/Simulate creating an appeal request for a violation (for demo/testing purposes)
        /// </summary>
        [HttpPost("~/api/manager/violations/{id:int}/simulate-appeal")]
        public async Task<IActionResult> SimulateAppeal(int id, CancellationToken ct)
        {
            var result = await _violationService.SimulateViolationAppealAsync(id, ct);
            if (!result) return BadRequest(new { message = "Biên bản vi phạm này đã được kháng nghị trước đó hoặc không tồn tại." });
            return Ok(new { message = "Simulated appeal created successfully." });
        }
    }
}
