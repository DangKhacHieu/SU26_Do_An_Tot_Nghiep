using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Request;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/requests")]
    public class ManagerRequestsController : ControllerBase
    {
        private readonly IRequestService _requestService;

        public ManagerRequestsController(IRequestService requestService)
        {
            _requestService = requestService;
        }

        /// <summary>
        /// UC-xx: View Requests List — Manager xem danh sách yêu cầu.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] RequestQueryParams queryParams,
            CancellationToken ct)
        {
            var result = await _requestService.GetRequestsForManagerAsync(queryParams, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: View Request Details — Manager xem chi tiết yêu cầu.
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetRequestById(
            int id,
            CancellationToken ct)
        {
            var result = await _requestService.GetRequestByIdForManagerAsync(id, ct);
            return Ok(result);
        }
    }
}
