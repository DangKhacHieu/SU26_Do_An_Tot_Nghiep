using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.StallTask;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/stall-tasks")]
    public class StallTasksController : ControllerBase
    {
        private readonly IStallTaskService _stallTaskService;

        public StallTasksController(IStallTaskService stallTaskService)
        {
            _stallTaskService = stallTaskService;
        }

        /// <summary>
        /// UC-48: View List Stall Tasks — Xem danh sách sạp cần thực hiện nhiệm vụ hoặc thu tiền.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetStallTasks(
            [FromQuery] int userId,
            [FromQuery] StallTaskQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _stallTaskService.GetStallTasksAsync(userId, queryParams, ct);
            return Ok(result);
        }
    }
}
