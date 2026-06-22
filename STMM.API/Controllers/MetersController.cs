using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Meter;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/meters")]
    public class MetersController : ControllerBase
    {
        private readonly IMeterReadingService _readingService;
        private readonly IMeterService _meterService;

        public MetersController(IMeterReadingService readingService, IMeterService meterService)
        {
            _readingService = readingService;
            _meterService = meterService;
        }

        /// <summary>
        /// Get all active meters for a stall (for Staff).
        /// </summary>
        [HttpGet("stall/{stallId}")]
        [Authorize(Roles = "Staff")]
        public async Task<IActionResult> GetMetersByStallId(int stallId, CancellationToken ct)
        {
            var result = await _readingService.GetMetersByStallIdAsync(stallId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get meter detail by ID (for Staff and Manager).
        /// </summary>
        [HttpGet("{id}")]
        [Authorize(Roles = "Staff,Manager")]
        public async Task<IActionResult> GetMeterById(int id, CancellationToken ct)
        {
            var result = await _meterService.GetMeterByIdAsync(id, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get all meters with paging and filters (for Manager).
        /// </summary>
        [HttpGet]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetMeters([FromQuery] MeterQueryParameters queryParams, CancellationToken ct)
        {
            var result = await _meterService.GetMetersAsync(queryParams, ct);
            return Ok(result);
        }

        /// <summary>
        /// Create new meter in warehouse (for Manager).
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> CreateMeter([FromBody] CreateMeterRequest request, CancellationToken ct)
        {
            var result = await _meterService.CreateMeterAsync(request, ct);
            return CreatedAtAction(nameof(GetMeterById), new { id = result.MeterId }, result);
        }

        /// <summary>
        /// Update meter info (for Manager).
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> UpdateMeter(int id, [FromBody] UpdateMeterRequest request, CancellationToken ct)
        {
            var result = await _meterService.UpdateMeterAsync(id, request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Delete meter (for Manager).
        /// </summary>
        [HttpDelete("{id}")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> DeleteMeter(int id, CancellationToken ct)
        {
            var result = await _meterService.DeleteMeterAsync(id, ct);
            return Ok(result);
        }

        /// <summary>
        /// Replace meter for a stall (for Manager).
        /// </summary>
        [HttpPost("replace")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> ReplaceMeter([FromBody] MeterReplacementRequest request, CancellationToken ct)
        {
            var result = await _meterService.ReplaceMeterAsync(request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get unassigned active meters (for Manager/Hải's Stall assign usecase).
        /// </summary>
        [HttpGet("unassigned")]
        [Authorize(Roles = "Manager")]
        public async Task<IActionResult> GetUnassignedMeters([FromQuery] string? type, CancellationToken ct)
        {
            var result = await _meterService.GetUnassignedMetersAsync(type, ct);
            return Ok(result);
        }
    }
}
