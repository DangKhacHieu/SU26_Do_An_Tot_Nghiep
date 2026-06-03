using Microsoft.AspNetCore.Mvc;
using Npgsql;
using STMM.DataAccess.Data;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public TestController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("ping")]
        public IActionResult Ping()
        {
            var connectionString = _configuration.GetConnectionString("DefaultConnection");
            try
            {
                using var conn = new NpgsqlConnection(connectionString);
                conn.Open();
                conn.Close();
                return Ok(new { connected = true, message = "PostgreSQL connected!" });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    error = ex.Message,
                    inner = ex.InnerException?.Message,
                    stack = ex.StackTrace
                });
            }
        }

        [HttpPost("test-create-stall")]
        public async Task<IActionResult> TestCreateStall([FromServices] STMM.Business.Interfaces.IStallService stallService, [FromBody] STMM.Business.DTOs.Stall.CreateStallDto dto)
        {
            try
            {
                var result = await stallService.CreateStallAsync(dto);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    innerException = ex.InnerException?.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }
    }
}
