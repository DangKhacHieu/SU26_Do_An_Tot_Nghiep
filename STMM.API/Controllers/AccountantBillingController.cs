using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Billing;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/billing")]
    [Authorize(Roles = "Accountant,Admin")]
    public class AccountantBillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public AccountantBillingController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        /// <summary>
        /// Lấy danh sách hóa đơn theo các bộ lọc (Month, Year, Status, Search).
        /// </summary>
        [HttpGet("invoices")]
        public async Task<IActionResult> GetInvoices(
            [FromQuery] int? month,
            [FromQuery] int? year,
            [FromQuery] string? status,
            [FromQuery] string? search,
            CancellationToken ct)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value ?? "0");
            var result = await _billingService.GetInvoicesAsync(month, year, status, search, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lấy chi tiết của một hóa đơn cụ thể (bóc tách các khoản phí).
        /// </summary>
        [HttpGet("invoices/{invoiceId}")]
        public async Task<IActionResult> GetInvoiceDetail(int invoiceId, CancellationToken ct)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value ?? "0");
            var result = await _billingService.GetInvoiceDetailForAccountantAsync(invoiceId, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Phát hành đồng loạt hóa đơn từ trạng thái Draft sang Unpaid.
        /// </summary>
        [HttpPost("invoices/bulk-approve")]
        public async Task<IActionResult> BulkApproveInvoices(
            [FromBody] BulkApproveInvoicesRequest request,
            CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Không xác định được danh tính kế toán." });

            var result = await _billingService.BulkApproveInvoicesAsync(request, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Phát hành 1 hóa đơn đột xuất (Ad-hoc) cho một gian hàng (ví dụ: đền bù tài sản, phạt).
        /// </summary>
        [HttpPost("invoices/ad-hoc")]
        public async Task<IActionResult> CreateAdHocInvoice(
            [FromBody] CreateAdHocInvoiceRequest request,
            CancellationToken ct)
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value;
            if (!int.TryParse(userIdClaim, out var userId))
                return Unauthorized(new { message = "Không xác định được danh tính kế toán." });

            var result = await _billingService.CreateAdHocInvoiceAsync(request, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Ô nhập số liệu thô (chỉ số điện/nước) dùng để sửa sai hoặc nhập bù khi mất mạng.
        /// Tự động cập nhật lại số tiền trên hóa đơn tương ứng của sạp.
        /// </summary>
        [HttpPost("meter-readings/adjust")]
        public async Task<IActionResult> AdjustMeterReading(
            [FromBody] MeterReadingAdjustmentRequest request,
            CancellationToken ct)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value ?? "0");
            var result = await _billingService.AdjustMeterReadingAsync(userId, request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Hủy bỏ một hóa đơn (chỉ dành cho hóa đơn Chưa thanh toán hoặc Nháp).
        /// </summary>
        [HttpPost("invoices/{invoiceId}/cancel")]
        public async Task<IActionResult> CancelInvoice(
            int invoiceId, 
            [FromBody] CancelInvoiceRequest request, 
            CancellationToken ct)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("userId")?.Value ?? "0");
            try
            {
                var result = await _billingService.CancelInvoiceAsync(invoiceId, request, userId, ct);
                return Ok(new { success = result, message = "Hủy hóa đơn thành công." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }
    }
}
