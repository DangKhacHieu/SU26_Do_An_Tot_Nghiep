using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Task;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/tasks")]
    [Authorize(Roles = "Staff")]
    public class StaffTasksController : ControllerBase
    {
        private readonly IStaffTaskService _staffTaskService;
        private readonly IAuditLogService _auditLogService;

        public StaffTasksController(IStaffTaskService staffTaskService, IAuditLogService auditLogService)
        {
            _staffTaskService = staffTaskService;
            _auditLogService = auditLogService;
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

        [HttpGet]
        public async Task<IActionResult> GetMyTasks(CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _staffTaskService.GetTasksForStaffAsync(userId, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(
            int id,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _staffTaskService.GetTaskByIdForStaffAsync(id, userId, ct);
            return Ok(result);
        }

        [HttpGet("{id}/stalls")]
        public async Task<IActionResult> GetTaskStalls(
            int id,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _staffTaskService.GetStallsForUtilityTaskAsync(id, userId, ct);
            return Ok(result);
        }

        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> CompleteTask(
            int id,
            [FromBody] CompleteTaskRequest request,
            CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _staffTaskService.CompleteTaskAsync(userId, id, request, ct);

            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Completed staff task (Task ID: {id})", ipAddress, ct);

            return Ok(result);
        }
    }
}
