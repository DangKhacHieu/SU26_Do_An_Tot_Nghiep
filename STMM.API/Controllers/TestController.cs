using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

        [HttpPost("seed-services")]
        public async Task<IActionResult> SeedServices()
        {
            try
            {
                // Create a fee type if not exists
                var feeType = _context.FeeTypes.FirstOrDefault(f => f.Name == "Dịch vụ định kỳ");
                if (feeType == null)
                {
                    feeType = new STMM.DataAccess.Entities.FeeType { Name = "Dịch vụ định kỳ", Description = "Phí dịch vụ" };
                    _context.FeeTypes.Add(feeType);
                    await _context.SaveChangesAsync();
                }

                // Get first user as creator
                var user = _context.Users.FirstOrDefault();
                if (user == null) return BadRequest("Không có user nào trong DB để tạo service");

                // Check if services exist
                if (!_context.Services.Any())
                {
                    _context.Services.AddRange(
                        new STMM.DataAccess.Entities.Service
                        {
                            Name = "Gói Vệ sinh Cao cấp (VIP)",
                            Description = "Vệ sinh sạp hàng mỗi ngày 2 lần, lau chùi kính và sát khuẩn. Phù hợp cho sạp thực phẩm.",
                            Price = 500000,
                            BillingCycle = "Monthly",
                            FeeTypeId = feeType.FeeTypeId,
                            CreatedByUserId = user.UserId,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new STMM.DataAccess.Entities.Service
                        {
                            Name = "Gói Bảo vệ An ninh 24/7",
                            Description = "Lắp đặt camera riêng tại sạp và dịch vụ tuần tra bảo vệ ban đêm chống trộm cắp.",
                            Price = 800000,
                            BillingCycle = "Monthly",
                            FeeTypeId = feeType.FeeTypeId,
                            CreatedByUserId = user.UserId,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        },
                        new STMM.DataAccess.Entities.Service
                        {
                            Name = "Dịch vụ Vận chuyển Nội khu",
                            Description = "Hỗ trợ xe đẩy và nhân công khuân vác hàng hóa từ bãi đỗ xe vào sạp hàng.",
                            Price = 300000,
                            BillingCycle = "Monthly",
                            FeeTypeId = feeType.FeeTypeId,
                            CreatedByUserId = user.UserId,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow
                        }
                    );
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Seeded 3 dummy services successfully!" });
                }

                return Ok(new { message = "Services already exist. Seed skipped." });
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost("force-fix-db")]
        public async Task<IActionResult> ForceFixDb()
        {
            try
            {
                // Fix the schema directly
                await _context.Database.ExecuteSqlRawAsync(@"
                    ALTER TABLE service_registrations ADD COLUMN IF NOT EXISTS end_date timestamp with time zone;
                    ALTER TABLE service_registrations ADD COLUMN IF NOT EXISTS is_auto_renew boolean NOT NULL DEFAULT true;
                ");

                // Seed the services
                await SeedServices();

                return Ok("Database fixed and services seeded!");
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
