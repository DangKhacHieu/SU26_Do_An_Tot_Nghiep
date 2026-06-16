using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public CategoriesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllCategories()
        {
            // Simply returning ID and Name for autocomplete dropdowns
            var categories = await _context.BusinessCategories
                .Where(c => c.IsActive == true)
                .Select(c => new { c.CategoryId, c.Name, c.Code })
                .ToListAsync();

            return Ok(categories);
        }
    }
}
