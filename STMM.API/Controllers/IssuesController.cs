using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Issue;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/issues")]
    [Authorize(Roles = "Staff")]
    public class IssuesController : ControllerBase
    {
        private readonly IIssueService _issueService;

        public IssuesController(IIssueService issueService)
        {
            _issueService = issueService;
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
        /// UC-51: View Issues List — Xem danh sách sự cố.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetIssues(
            [FromQuery] int userId,
            [FromQuery] IssueQueryParams queryParams,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _issueService.GetIssuesAsync(userId, queryParams, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-53: View Issue Details — Xem chi tiết sự cố.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetIssueById(
            int id,
            [FromQuery] int userId,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _issueService.GetIssueByIdAsync(id, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-50: Create Issue Report — Staff báo cáo sự cố hạ tầng chợ.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateIssue(
            [FromQuery] int userId,
            [FromBody] CreateIssueRequest request,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _issueService.CreateIssueAsync(userId, request, ct);
            return CreatedAtAction(nameof(GetIssueById), new { id = result.IssueId, userId }, result);
        }

        /// <summary>
        /// UC-52: Update Issue Status — Cập nhật trạng thái xử lý sự cố.
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateIssueStatus(
            int id,
            [FromQuery] int userId,
            [FromBody] UpdateIssueStatusRequest request,
            CancellationToken ct)
        {
            userId = GetUserId();
            var result = await _issueService.UpdateIssueStatusAsync(userId, id, request, ct);
            return Ok(result);
        }
    }
}
