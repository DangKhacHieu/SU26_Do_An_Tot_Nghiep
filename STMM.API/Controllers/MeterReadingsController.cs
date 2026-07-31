using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Meter;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/meter-readings")]
    [Authorize(Roles = "Staff")]
    public class MeterReadingsController : ControllerBase
    {
        private readonly IMeterReadingService _service;

        public MeterReadingsController(IMeterReadingService service)
        {
            _service = service;
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
        /// Get meter readings history for a stall (last 6 months, paged).
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetReadings(
            [FromQuery] int stallId,
            [FromQuery] MeterReadingQueryParams query,
            CancellationToken ct)
        {
            var result = await _service.GetReadingsByStallIdAsync(GetUserId(), stallId, query, ct);
            return Ok(result);
        }

        /// <summary>
        /// Record a new meter reading.
        /// </summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateReading(
            [FromForm] CreateMeterReadingRequest request,
            CancellationToken ct)
        {
            var result = await _service.CreateReadingAsync(GetUserId(), request, ct);
            return CreatedAtAction(null, result);
        }
    }
}
