using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        /// <summary>
        /// Lấy dữ liệu thống kê tổng hợp và báo cáo cho vai trò Kế toán.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetDashboardData(CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            var userId = int.Parse(userIdClaim ?? "0");
            var result = await _dashboardService.GetAccountantDashboardDataAsync(userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Xuất báo cáo Doanh Thu và Lịch Sử Giao Dịch ra file Excel (.xlsx).
        /// </summary>
        [HttpGet("export")]
        public async Task<IActionResult> ExportDashboardData(CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            var userId = int.Parse(userIdClaim ?? "0");
            
            var fileContent = await _dashboardService.ExportDashboardReportAsync(userId, ct);
            
            return File(
                fileContent, 
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", 
                $"Bao_Cao_Doanh_Thu_{System.DateTime.Now:yyyyMMdd}.xlsx");
        }
    }
}
