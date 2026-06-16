using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Quotation;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/tasks/{taskId}/[controller]")]
    public class QuotationController : ControllerBase
    {
        private readonly IQuotationService _quotationService;

        public QuotationController(IQuotationService quotationService)
        {
            _quotationService = quotationService;
        }

        /// <summary>
        /// UC-Materials-View: Xem danh sách vật tư đã thêm và tổng tiền báo giá hiện tại.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetQuotation(
            int taskId,
            [FromQuery] int userId,
            CancellationToken ct)
        {
            var result = await _quotationService.GetQuotationAsync(taskId, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-Select-Repair-Materials: Staff thêm một dòng vật tư vào báo giá.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> AddMaterial(
            int taskId,
            [FromQuery] int userId,
            [FromBody] AddMaterialRequest request,
            CancellationToken ct)
        {
            var result = await _quotationService.AddMaterialAsync(taskId, userId, request, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-Review-Quotation: Staff xóa một dòng vật tư khỏi báo giá.
        /// </summary>
        [HttpDelete("{materialId}")]
        public async Task<IActionResult> RemoveMaterial(
            int taskId,
            int materialId,
            [FromQuery] int userId,
            CancellationToken ct)
        {
            var result = await _quotationService.RemoveMaterialAsync(taskId, materialId, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// UC-Submit-Quotation: Staff xác nhận gửi báo giá — task chuyển sang PendingApproval.
        /// </summary>
        [HttpPatch("~/api/staff/tasks/{taskId}/submit-quotation")]
        public async Task<IActionResult> SubmitQuotation(
            int taskId,
            [FromQuery] int userId,
            CancellationToken ct)
        {
            var result = await _quotationService.SubmitQuotationAsync(taskId, userId, ct);
            return Ok(result);
        }
    }
}
