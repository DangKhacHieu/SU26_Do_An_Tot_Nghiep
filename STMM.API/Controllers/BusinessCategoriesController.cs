using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.BusinessCategory;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/business-categories")]
    public class BusinessCategoriesController : ControllerBase
    {
        private readonly IBusinessCategoryService _categoryService;

        public BusinessCategoriesController(IBusinessCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BusinessCategoryDto>>> GetAllCategories(
            [FromQuery] string? search = null,
            [FromQuery] bool? isActive = null,
            CancellationToken ct = default)
        {
            try
            {
                var currentUserId = GetUserId();
                var categories = await _categoryService.GetAllCategoriesAsync(search, isActive, currentUserId, ct);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<BusinessCategoryDto>> GetCategoryById(int id, CancellationToken ct)
        {
            try
            {
                var currentUserId = GetUserId();
                var category = await _categoryService.GetCategoryByIdAsync(id, currentUserId, ct);
                if (category == null)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục kinh doanh." });
                }
                return Ok(category);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<BusinessCategoryDto>> CreateCategory(
            [FromBody] CreateBusinessCategoryRequest request,
            CancellationToken ct)
        {
            try
            {
                var currentUserId = GetUserId();
                var created = await _categoryService.CreateCategoryAsync(request, currentUserId, ct);
                return CreatedAtAction(nameof(GetCategoryById), new { id = created.CategoryId }, created);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<BusinessCategoryDto>> UpdateCategory(
            int id,
            [FromBody] UpdateBusinessCategoryRequest request,
            CancellationToken ct)
        {
            try
            {
                var currentUserId = GetUserId();
                var updated = await _categoryService.UpdateCategoryAsync(id, request, currentUserId, ct);
                return Ok(updated);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteCategory(int id, CancellationToken ct)
        {
            try
            {
                var currentUserId = GetUserId();
                var result = await _categoryService.DeleteCategoryAsync(id, currentUserId, ct);
                if (!result)
                {
                    return NotFound(new { message = "Không tìm thấy danh mục kinh doanh." });
                }
                return NoContent();
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
