using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Area;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AreasController : ControllerBase
    {
        private readonly IAreaService _areaService;

        public AreasController(IAreaService areaService)
        {
            _areaService = areaService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AreaDto>>> GetAllAreas([FromQuery] int? marketId = null)
        {
            try
            {
                var areas = await _areaService.GetAllAreasAsync(marketId);
                return Ok(areas);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<AreaDto>> GetAreaById(int id)
        {
            try
            {
                var area = await _areaService.GetAreaByIdAsync(id);
                if (area == null)
                {
                    return NotFound(new { message = "Area not found" });
                }
                return Ok(area);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<AreaDto>> CreateArea([FromBody] CreateAreaRequest request)
        {
            try
            {
                var createdArea = await _areaService.CreateAreaAsync(request);
                return CreatedAtAction(nameof(GetAreaById), new { id = createdArea.AreaId }, createdArea);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<AreaDto>> UpdateArea(int id, [FromBody] UpdateAreaRequest request)
        {
            try
            {
                var updatedArea = await _areaService.UpdateAreaAsync(id, request);
                return Ok(updatedArea);
            }
            catch (Exception ex)
            {
                if (ex.Message == "Area not found")
                {
                    return NotFound(new { message = ex.Message });
                }
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteArea(int id)
        {
            try
            {
                var result = await _areaService.DeleteAreaAsync(id);
                if (!result)
                {
                    return NotFound(new { message = "Area not found" });
                }
                return NoContent();
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
