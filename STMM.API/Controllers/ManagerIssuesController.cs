using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Issue;
using STMM.Business.Interfaces;
using System.Security.Claims;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/issues")]
    [Authorize(Roles = "Manager")]
    public class ManagerIssuesController : ControllerBase
    {
        private readonly IIssueService _issueService;

        public ManagerIssuesController(IIssueService issueService)
        {
            _issueService = issueService;
        }

        [HttpGet]
        public async Task<IActionResult> GetIssues(
            [FromQuery] IssueQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _issueService.GetIssuesForManagerAsync(GetUserId(), queryParams, ct);
            return Ok(result);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetIssueById(int id, CancellationToken ct)
        {
            var result = await _issueService.GetIssueByIdForManagerAsync(GetUserId(), id, ct);
            return Ok(result);
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
