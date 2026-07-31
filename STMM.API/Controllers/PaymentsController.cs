using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using STMM.Business.DTOs.Payment;
using STMM.Business.Interfaces;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PaymentsController : ControllerBase
    {
        private readonly IMomoService _momoService;
        private readonly IVnpayService _vnpayService;
        private readonly VnpayConfig _vnpayConfig;
        private readonly ILogger<PaymentsController> _logger;

        public PaymentsController(
            IMomoService momoService,
            IVnpayService vnpayService,
            IOptions<VnpayConfig> vnpayConfig,
            ILogger<PaymentsController> logger)
        {
            _momoService = momoService;
            _vnpayService = vnpayService;
            _vnpayConfig = vnpayConfig.Value;
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

        [HttpPost("vnpay/create")]
        public async Task<IActionResult> CreateVnpayPayment([FromBody] CreatePaymentRequest request)
        {
            try
            {
                var payUrl = await _vnpayService.CreatePaymentUrlAsync(request.InvoiceId);
                return Ok(new { payUrl });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi tạo thanh toán VNPay.");
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("vnpay/ipn")]
        public async Task<IActionResult> VnpayIpn()
        {
            try
            {
                var queryParams = new Dictionary<string, string>();
                foreach (var key in Request.Query.Keys)
                {
                    queryParams[key] = Request.Query[key]!;
                }

                // Kiểm tra chữ ký bảo mật trước khi xử lý
                var vnpay = new STMM.Business.Services.VnpayLibrary();
                string vnp_SecureHash = string.Empty;
                foreach (var kv in queryParams)
                {
                    if (kv.Key == "vnp_SecureHash")
                        vnp_SecureHash = kv.Value;
                    else if (kv.Key.StartsWith("vnp_"))
                        vnpay.AddResponseData(kv.Key, kv.Value);
                }

                if (string.IsNullOrEmpty(vnp_SecureHash) || !vnpay.ValidateSignature(vnp_SecureHash, _vnpayConfig.HashSecret))
                {
                    _logger.LogWarning("VNPay IPN signature verification failed in controller.");
                    return Ok(new { RspCode = "97", Message = "Invalid signature" });
                }

                var success = await _vnpayService.ProcessIpnAsync(queryParams);
                if (success)
                {
                    return Ok(new { RspCode = "00", Message = "Confirm Success" });
                }

                return Ok(new { RspCode = "99", Message = "An error occurred" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý IPN VNPay.");
                return Ok(new { RspCode = "99", Message = ex.Message });
            }
        }

        [HttpGet("vnpay/result")]
        public async Task<IActionResult> VnpayResult()
        {
            try
            {
                var queryParams = new Dictionary<string, string>();
                foreach (var key in Request.Query.Keys)
                {
                    queryParams[key] = Request.Query[key]!;
                }

                var success = await _vnpayService.ProcessIpnAsync(queryParams);
                if (success)
                {
                    return Redirect("http://localhost:5173/vendor/dashboard?menu=BILLS&payment=success");
                }
                return Redirect("http://localhost:5173/vendor/dashboard?menu=BILLS&payment=error");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xử lý ReturnUrl VNPay.");
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
