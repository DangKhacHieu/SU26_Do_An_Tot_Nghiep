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

        /// <summary>
        /// UC-xx: View Issues List for Manager — Manager xem danh sách sự cố hạ tầng chợ.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetIssues(
            [FromQuery] IssueQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _issueService.GetIssuesForManagerAsync(queryParams, ct);
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
            var result = await _issueService.GetIssueByIdForManagerAsync(id, ct);
            return Ok(result);
        }
    }
}
