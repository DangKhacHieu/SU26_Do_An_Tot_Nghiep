using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Issue;
using STMM.Business.Interfaces;
using System.Security.Claims;

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

        [HttpGet]
        public async Task<IActionResult> GetIssues(
            CancellationToken ct)
        {
            var result = await _issueService.GetIssuesAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIssueById(int id, CancellationToken ct)
        {
            var result = await _issueService.GetIssueByIdAsync(id, GetUserId(), ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateIssue(
            [FromBody] CreateIssueRequest request,
            CancellationToken ct)
        {
            var result = await _issueService.CreateIssueAsync(GetUserId(), request, ct);
            return CreatedAtAction(nameof(GetIssueById), new { id = result.IssueId }, result);
        }

        private int GetUserId()
        {
            var claim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(claim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token.");
            }

            return userId;
        }
    }
}
