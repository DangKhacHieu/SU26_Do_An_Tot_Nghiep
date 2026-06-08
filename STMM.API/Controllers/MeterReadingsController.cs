using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Meter;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/meter-readings")]
    public class MeterReadingsController : ControllerBase
    {
        private readonly IMeterReadingService _service;

        public MeterReadingsController(IMeterReadingService service)
        {
            _service = service;
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
            var result = await _service.GetReadingsByStallIdAsync(stallId, query, ct);
            return Ok(result);
        }

        /// <summary>
        /// Record a new meter reading.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReading(
            [FromQuery] int userId,
            [FromBody] CreateMeterReadingRequest request,
            CancellationToken ct)
        {
            var result = await _service.CreateReadingAsync(userId, request, ct);
            return CreatedAtAction(null, result);
        }
    }
}
