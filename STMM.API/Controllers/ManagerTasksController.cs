using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Task;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/tasks")]
    public class ManagerTasksController : ControllerBase
    {
        private readonly IStaffTaskService _staffTaskService;

        public ManagerTasksController(IStaffTaskService staffTaskService)
        {
            _staffTaskService = staffTaskService;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        [HttpGet]
        public async Task<IActionResult> GetTasks(
            [FromQuery] TaskQueryParams queryParams,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _staffTaskService.GetTasksForManagerAsync(queryParams, managerUserId, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(
            int id,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _staffTaskService.GetTaskByIdAsync(id, managerUserId, ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(
            [FromQuery] int userId, // managerUserId
            [FromBody] CreateTaskRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.CreateTaskAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetTaskById), new { id = result.TaskId }, result);
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateTaskStatus(
            int id,
            [FromBody] UpdateTaskStatusRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.UpdateTaskStatusAsync(id, request, ct);
            return Ok(result);
        }

        [HttpPatch("{id}/assign")]
        public async Task<IActionResult> AssignTask(
            int id,
            [FromBody] AssignTaskRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.AssignTaskAsync(id, request.StaffUserId, ct);
            return Ok(result);
        }
    }
}
