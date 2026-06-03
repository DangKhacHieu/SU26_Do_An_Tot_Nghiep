using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Violation;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/violations")]
    public class ViolationsController : ControllerBase
    {
        private readonly IViolationService _violationService;

        public ViolationsController(IViolationService violationService)
        {
            _violationService = violationService;
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
    }
}
