using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.StallTask;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/stall-tasks")]
    [Authorize(Roles = "Staff")]
    public class StallTasksController : ControllerBase
    {
        private readonly IStallTaskService _stallTaskService;

        public StallTasksController(IStallTaskService stallTaskService)
        {
            _stallTaskService = stallTaskService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                throw new System.UnauthorizedAccessException("User ID not found in token.");
            }
            return userId;
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
            userId = GetUserId();
            var result = await _stallTaskService.GetStallTasksAsync(userId, queryParams, ct);
            return Ok(result);
        }
    }
}
