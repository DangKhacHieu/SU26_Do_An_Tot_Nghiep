using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Billing;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/payments")]
    public class PaymentVerificationController : ControllerBase
    {
        private readonly IBillingService _billingService;

        public PaymentVerificationController(IBillingService billingService)
        {
            _billingService = billingService;
        }

        /// <summary>
        /// Lấy danh sách giao dịch nộp tiền mặt hoặc online chờ đối soát.
        /// </summary>
        [HttpGet("pending")]
        public async Task<IActionResult> GetPendingPayments(CancellationToken ct)
        {
            var result = await _billingService.GetPendingPaymentsAsync(ct);
            return Ok(result);
        }

        /// <summary>
        /// Duyệt (Approve) hoặc Từ chối (Reject) giao dịch thanh toán.
        /// </summary>
        [HttpPost("{paymentId}/verify")]
        public async Task<IActionResult> VerifyPayment(
            int paymentId,
            [FromQuery] int userId, // ID kế toán duyệt
            [FromBody] VerifyPaymentRequest request,
            CancellationToken ct)
        {
            var result = await _billingService.VerifyPaymentAsync(paymentId, request, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách sạp chợ có dư nợ (tiền thuê, điện nước, vi phạm).
        /// </summary>
        [HttpGet("debts")]
        public async Task<IActionResult> GetStallsDebtList([FromQuery] string? search, CancellationToken ct)
        {
            var result = await _billingService.GetStallsDebtListAsync(search, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lấy chi tiết các khoản nợ của một sạp cụ thể.
        /// </summary>
        [HttpGet("debts/{stallId}")]
        public async Task<IActionResult> GetStallDebtDetails(int stallId, CancellationToken ct)
        {
            var result = await _billingService.GetStallDebtDetailsAsync(stallId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Gửi thông báo nhắc nợ đến tiểu thương sạp cụ thể.
        /// </summary>
        [HttpPost("debts/notify")]
        public async Task<IActionResult> SendDebtReminder(
            [FromQuery] int userId, // ID kế toán gửi
            [FromBody] SendDebtNotificationRequest request,
            CancellationToken ct)
        {
            var result = await _billingService.SendDebtReminderAsync(request, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lấy danh sách kháng nghị hóa đơn từ tiểu thương.
        /// </summary>
        [HttpGet("disputes")]
        public async Task<IActionResult> GetInvoiceDisputes(CancellationToken ct)
        {
            var result = await _billingService.GetInvoiceDisputesAsync(ct);
            return Ok(result);
        }

        /// <summary>
        /// Giải quyết kháng nghị hóa đơn (Duyệt/Từ chối).
        /// </summary>
        [HttpPost("disputes/{requestId}/resolve")]
        public async Task<IActionResult> ResolveInvoiceDispute(
            int requestId,
            [FromQuery] int userId, // ID kế toán duyệt
            [FromBody] ResolveDisputeRequest request,
            CancellationToken ct)
        {
            var result = await _billingService.ResolveInvoiceDisputeAsync(requestId, request, userId, ct);
            return Ok(result);
        }
    }
}
