using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Request;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/requests")]
    [Authorize(Roles = "Manager")]
    public class ManagerRequestsController : ControllerBase
    {
        private readonly IRequestService _requestService;

        public ManagerRequestsController(IRequestService requestService)
        {
            _requestService = requestService;
        }

        private int? GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(claim, out int uid)) return uid;
            return null;
        }

        private int GetManagerUserId()
        {
            return GetUserId() ?? throw new System.UnauthorizedAccessException("User ID not found in token.");
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
        /// Manager xác định bên chịu phí và bước xử lý tiếp theo của báo giá.
        /// </summary>
        [HttpPost("{id}/resolve-quotation")]
        public async Task<IActionResult> ResolveQuotation(
            int id,
            [FromBody] ManagerQuotationDecisionRequest decision,
            CancellationToken ct)
        {
            var managerUserId = GetManagerUserId();
            var result = await _requestService.ResolveRequestQuotationAsync(
                id, managerUserId, decision, ct);
            return Ok(result);
        }
    }
}
