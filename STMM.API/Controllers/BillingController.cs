using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Billing;
using STMM.Business.Interfaces;
using System.Security.Claims;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/staff/billing")]
    [Authorize(Roles = "Staff")]
    public class BillingController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public BillingController(IBillingService billingService)
        {
            _billingService = billingService;
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
        /// View Payment Details — Staff xem chi tiết hóa đơn của sạp.
        /// </summary>
        [HttpGet("invoices/{invoiceId}")]
        public async Task<IActionResult> GetInvoiceDetail(
            int invoiceId,
            CancellationToken ct)
        {
            var result = await _billingService.GetInvoiceDetailAsync(GetUserId(), invoiceId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Receive Cash Payment — Staff ghi nhận thu tiền mặt tại sạp.
        /// Invoice chuyển sang Pending Confirmation, chờ Kế toán phê duyệt.
        /// </summary>
        [HttpPost("payments/cash")]
        public async Task<IActionResult> ReceiveCashPayment(
            [FromBody] ReceiveCashPaymentRequest request,
            CancellationToken ct)
        {
            var result = await _billingService.ReceiveCashPaymentAsync(GetUserId(), request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Get list of unpaid invoices for a specific stall (to choose for cash payment).
        /// </summary>
        [HttpGet("invoices/stall/{stallId}/unpaid")]
        public async Task<IActionResult> GetUnpaidInvoicesByStall(int stallId, CancellationToken ct)
        {
            var result = await _billingService.GetUnpaidInvoicesByStallAsync(GetUserId(), stallId, ct);
            return Ok(result);
        }
    }
}
