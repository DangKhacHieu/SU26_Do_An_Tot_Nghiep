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

        private int? GetUserId()
        {
            var claim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        /// <summary>
        /// UC-xx: View Requests List — Manager xem danh sách yêu cầu.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetRequests(
            [FromQuery] RequestQueryParams queryParams,
            CancellationToken ct)
        {
            var managerUserId = GetUserId();
            var result = await _requestService.GetRequestsForManagerAsync(queryParams, managerUserId, ct);
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
            var managerUserId = GetUserId();
            var result = await _requestService.GetRequestByIdForManagerAsync(id, managerUserId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: Resolve Violation Appeal — Manager phê duyệt hoặc bác bỏ kháng nghị vi phạm.
        /// </summary>
        [HttpPost("{id}/resolve-appeal")]
        public async Task<IActionResult> ResolveAppeal(
            int id,
            [FromQuery] bool approve,
            CancellationToken ct)
        {
            var result = await _requestService.ResolveViolationAppealAsync(id, approve, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-xx: Resolve Request Quote — Manager duyệt hoặc từ chối báo giá (chỉ áp dụng khi BQL chịu phí).
        /// </summary>
        [HttpPost("{id}/resolve-quote")]
        public async Task<IActionResult> ResolveQuote(
            int id,
            [FromQuery] bool approve,
            CancellationToken ct)
        {
            var result = await _requestService.ResolveRequestQuoteAsync(id, approve, ct);
            return Ok(result);
        }
    }
}
