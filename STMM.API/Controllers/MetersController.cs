using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/meters")]
    [Authorize(Roles = "Staff,Manager,Admin")]
    public class MetersController : ControllerBase
    {
        private readonly IMeterReadingService _service;

        public MetersController(IMeterReadingService service)
        {
            _service = service;
        }

        /// <summary>
        /// Get all unassigned meters (StallId is null).
        /// </summary>
        [HttpGet("unassigned")]
        [Authorize(Roles = "Admin,Manager,Staff")]
        public async Task<IActionResult> GetUnassignedMeters([FromQuery] string? type, CancellationToken ct)
        {
            var result = await _service.GetUnassignedMetersAsync(type, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get all active meters for a stall.
        /// </summary>
        [HttpGet("stall/{stallId}")]
        public async Task<IActionResult> GetMetersByStallId(int stallId, CancellationToken ct)
        {
            var result = await _service.GetMetersByStallIdAsync(stallId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get meter detail by ID.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetMeterById(int id, CancellationToken ct)
        {
            var result = await _service.GetMeterByIdAsync(id, ct);
            return Ok(result);
        }
    }
}
