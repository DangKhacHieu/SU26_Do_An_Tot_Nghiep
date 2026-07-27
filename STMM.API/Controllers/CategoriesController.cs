using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using STMM.Business.DTOs.BusinessCategory;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IBusinessCategoryService _categoryService;

        public CategoriesController(IBusinessCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<BusinessCategoryDto>>> GetAllCategories()
        {
            int? currentUserId = null;
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) currentUserId = uid;

            var categories = await _categoryService.GetAllCategoriesAsync(null, null, currentUserId);
            return Ok(categories);
        }
    }
}
