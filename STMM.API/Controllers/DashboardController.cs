using Microsoft.AspNetCore.Mvc;
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
        public async Task<IActionResult> GetDashboardData([FromQuery] int? userId, CancellationToken ct)
        {
            var result = await _dashboardService.GetAccountantDashboardDataAsync(userId, ct);
            return Ok(result);
        }
    }
}
