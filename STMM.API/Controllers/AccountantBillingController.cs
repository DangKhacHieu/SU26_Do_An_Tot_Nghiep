using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Billing;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/billing")]
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
            [FromQuery] int? userId,
            CancellationToken ct)
        {
            var result = await _billingService.GetInvoicesAsync(month, year, status, search, userId, ct);
            return Ok(result);
        }

        /// <summary>
        /// Lấy chi tiết của một hóa đơn cụ thể (bóc tách các khoản phí).
        /// </summary>
        [HttpGet("invoices/{invoiceId}")]
        public async Task<IActionResult> GetInvoiceDetail(int invoiceId, CancellationToken ct)
        {
            var result = await _billingService.GetInvoiceDetailAsync(invoiceId, ct);
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
            var result = await _billingService.BulkApproveInvoicesAsync(request, ct);
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
            var result = await _billingService.CreateAdHocInvoiceAsync(request, ct);
            return Ok(result);
        }

        /// <summary>
        /// Ô nhập số liệu thô (chỉ số điện/nước) dùng để sửa sai hoặc nhập bù khi mất mạng.
        /// Tự động cập nhật lại số tiền trên hóa đơn tương ứng của sạp.
        /// </summary>
        [HttpPost("meter-readings/adjust")]
        public async Task<IActionResult> AdjustMeterReading(
            [FromQuery] int userId,
            [FromBody] MeterReadingAdjustmentRequest request,
            CancellationToken ct)
        {
            var result = await _billingService.AdjustMeterReadingAsync(userId, request, ct);
            return Ok(result);
        }
    }
}
