using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Task;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/tasks")]
    public class StaffTasksController : ControllerBase
    {
        private readonly IStaffTaskService _staffTaskService;

        public StaffTasksController(IStaffTaskService staffTaskService)
        {
            _staffTaskService = staffTaskService;
        }

        [HttpGet]
        public async Task<IActionResult> GetMyTasks(
            [FromQuery] int userId, // staffUserId
            [FromQuery] TaskQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _staffTaskService.GetTasksForStaffAsync(userId, queryParams, ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(
            int id,
            [FromQuery] int userId, // staffUserId (can be used for auth check in service)
            CancellationToken ct)
        {
            var result = await _staffTaskService.GetTaskByIdAsync(id, ct);
            // Verify that the task is assigned to this staff user
            if (result.AssignedToUserId != userId)
            {
                return Forbid("You are not assigned to this task.");
            }
            return Ok(result);
        }

        [HttpGet("{id}/stalls")]
        public async Task<IActionResult> GetTaskStalls(
            int id,
            [FromQuery] int userId, // staffUserId
            CancellationToken ct)
        {
            var result = await _staffTaskService.GetStallsForUtilityTaskAsync(id, userId, ct);
            return Ok(result);
        }

        [HttpPatch("{id}/complete")]
        public async Task<IActionResult> CompleteTask(
            int id,
            [FromQuery] int userId, // staffUserId
            [FromBody] CompleteTaskRequest request,
            CancellationToken ct)
        {
            var result = await _staffTaskService.CompleteTaskAsync(userId, id, request, ct);
            return Ok(result);
        }
    }
}
