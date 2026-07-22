using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Payment;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IMomoService _momoService;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(IMomoService momoService, ILogger<PaymentsController> logger)
        {
            _momoService = momoService;
            _logger = logger;
        }

        [HttpPost("momo/create")]
        public async Task<IActionResult> CreateMomoPayment([FromBody] CreatePaymentRequest request)
        {
            try
            {
                // requestType: "captureWallet" (QR) hoặc "payWithATM" (Thẻ ATM)
                var payUrl = await _momoService.CreatePaymentAsync(request.InvoiceId, request.RequestType);
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tạo thanh toán MoMo.");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("momo/ipn")]
        public async Task<IActionResult> MomoIpn([FromBody] MomoIPNRequest request)
        {
            try
            {
                var success = await _momoService.ProcessIpnAsync(request);
                if (success)
                {
                    return NoContent(); // Trả về 204 cho MoMo biết là đã xử lý thành công
                }
                return BadRequest();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý IPN MoMo.");
                return BadRequest();
            }
        }

        [HttpGet("momo/result")]
        public async Task<IActionResult> MomoResult([FromQuery] MomoIPNRequest request)
        {
            try
            {
                // Khi test ở local không có ngrok, dùng ReturnUrl để kích hoạt update DB
                var success = await _momoService.ProcessIpnAsync(request);
                
                if (success)
                {
                    return Redirect("http://localhost:5173/vendor/dashboard?menu=BILLS&payment=success");
                }
                return Redirect("http://localhost:5173/vendor/dashboard?menu=BILLS&payment=error");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý ReturnUrl MoMo.");
                return Redirect("http://localhost:5173/vendor/dashboard?menu=BILLS&payment=error");
            }
        }
    }

    public class CreatePaymentRequest
    {
        public int InvoiceId { get; set; }
        public string RequestType { get; set; } = "captureWallet";
    }
}
