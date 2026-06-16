using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using STMM.Business.DTOs.Stall;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StallsController : ControllerBase
    {
        private readonly IStallService _stallService;

        public StallsController(IStallService stallService)
        {
            _stallService = stallService;
        }

        [HttpGet("area/{areaId}")]
        public async Task<ActionResult<IEnumerable<StallDto>>> GetAllStallsByAreaId(int areaId)
        {
            var stalls = await _stallService.GetAllStallsByAreaIdAsync(areaId);
            return Ok(stalls);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StallDto>> GetStallById(int id)
        {
            var stall = await _stallService.GetStallByIdAsync(id);
            if (stall == null) return NotFound();
            return Ok(stall);
        }

        [HttpPost]
        public async Task<ActionResult<StallDto>> CreateStall([FromBody] CreateStallDto createStallDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            var stall = await _stallService.CreateStallAsync(createStallDto);
            return CreatedAtAction(nameof(GetStallById), new { id = stall.StallId }, stall);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<StallDto>> UpdateStall(int id, [FromBody] UpdateStallDto updateStallDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var stall = await _stallService.UpdateStallAsync(id, updateStallDto);
                return Ok(stall);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("{id}/location")]
        public async Task<ActionResult<StallDto>> UpdateStallLocation(int id, [FromBody] UpdateStallLocationDto locationDto)
        {
            try
            {
                var stall = await _stallService.UpdateStallLocationAsync(id, locationDto);
                return Ok(stall);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpPut("{id}/status")]
        public async Task<ActionResult<StallDto>> UpdateStallStatus(int id, [FromBody] string status)
        {
            try
            {
                var stall = await _stallService.UpdateStallStatusAsync(id, status);
                return Ok(stall);
            }
            catch (KeyNotFoundException)
            {
                return NotFound();
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeactivateStall(int id)
        {
            var result = await _stallService.DeactivateStallAsync(id);
            if (!result) return NotFound();
            return NoContent();
        }
    }
}
