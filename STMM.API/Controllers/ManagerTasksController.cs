using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Task;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Claims;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/tasks")]
    [Authorize(Roles = "Manager")]
    public class ManagerTasksController : ControllerBase
    {
        private readonly IStaffTaskService _staffTaskService;

        public ManagerTasksController(IStaffTaskService staffTaskService)
        {
            _staffTaskService = staffTaskService;
        }

        private int GetUserId()
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                throw new System.UnauthorizedAccessException("User ID not found in token.");
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks(
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _staffTaskService.GetTasksForManagerAsync(managerUserId, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(
            int id,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _staffTaskService.GetTaskByIdForManagerAsync(id, managerUserId, ct);
            return Ok(result);
        }

        [HttpGet("{id}/stalls")]
        public async Task<IActionResult> GetTaskStalls(
            int id,
            CancellationToken ct)
        {
            var result = await _staffTaskService.GetStallsForUtilityTaskForManagerAsync(id, GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(
            [FromBody] CreateTaskRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.CreateTaskAsync(GetUserId(), request, ct);
            return CreatedAtAction(nameof(GetTaskById), new { id = result.TaskId }, result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(
            int id,
            [FromBody] UpdateTaskStatusRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.UpdateTaskStatusAsync(GetUserId(), id, request, ct);
            return Ok(result);
        }

        [HttpPatch("{id}/assign")]
        public async Task<IActionResult> AssignTask(
            int id,
            [FromBody] AssignTaskRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.AssignTaskAsync(GetUserId(), id, request.StaffUserId, ct);
            return Ok(result);
        }
    }
}
