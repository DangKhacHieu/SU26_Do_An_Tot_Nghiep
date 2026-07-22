using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Issue;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

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

        private int? GetUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        /// <summary>
        /// UC-xx: View Issues List for Manager — Manager xem danh sách sự cố hạ tầng chợ.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetIssues(
            [FromQuery] IssueQueryParams queryParams,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _issueService.GetIssuesForManagerAsync(queryParams, managerUserId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: View Issue Details for Manager — Manager xem chi tiết sự cố.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetIssueById(
            int id,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _issueService.GetIssueByIdForManagerAsync(id, managerUserId, ct);
            return Ok(result);
        }
    }
}
