using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System;
using STMM.Business.DTOs.Stall;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;

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

        [HttpGet]
        public async Task<ActionResult<IEnumerable<StallDto>>> GetAllStalls()
        {
            var stalls = await _stallService.GetAllStallsAsync();
            return Ok(stalls);
        }

        [HttpGet("area/{areaId}")]
        public async Task<ActionResult<IEnumerable<StallDto>>> GetAllStallsByAreaId(int areaId)
        {
            try
            {
                var stalls = await _stallService.GetAllStallsByAreaIdAsync(areaId);
                return Ok(stalls);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<StallDto>> GetStallById(int id)
        {
            try
            {
                var stall = await _stallService.GetStallByIdAsync(id);
                return Ok(stall);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<StallDto>> CreateStall([FromBody] CreateStallDto createStallDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            
            try
            {
                var stall = await _stallService.CreateStallAsync(createStallDto);
                return CreatedAtAction(nameof(GetStallById), new { id = stall.StallId }, stall);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                var innerMsg = ex.InnerException != null ? ex.InnerException.Message : "";
                System.IO.File.AppendAllText("error_log.txt", $"{DateTime.Now}: {ex.ToString()}\n\n");
                return StatusCode(500, new { title = ex.Message, details = $"{innerMsg}\n{ex.StackTrace}" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<StallDto>> UpdateStall(int id, [FromBody] UpdateStallDto updateStallDto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var stall = await _stallService.UpdateStallAsync(id, updateStallDto);
                if (stall == null) return NotFound();
                return Ok(stall);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
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
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
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
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeactivateStall(int id)
        {
            try
            {
                await _stallService.DeactivateStallAsync(id);
                return NoContent();
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("highest-rated")]
        public async Task<ActionResult<object>> GetHighestRatedStall()
        {
            var result = await _stallService.GetHighestRatedStallAsync();
            if (result == null)
            {
                return NotFound("Không tìm thấy gian hàng nào.");
            }

            return Ok(result);
        }
    }
}
