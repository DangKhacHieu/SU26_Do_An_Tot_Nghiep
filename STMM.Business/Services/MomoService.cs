using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using STMM.Business.DTOs.Payment;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;

namespace STMM.Business.Services
{
    public class MomoService : IMomoService
    {
        private readonly MomoConfig _momoConfig;
        private readonly AppDbContext _context;
        private readonly ILogger<MomoService> _logger;
        private readonly HttpClient _httpClient;

        public MomoService(IOptions<MomoConfig> momoConfig, AppDbContext context, ILogger<MomoService> logger, IHttpClientFactory httpClientFactory)
        {
            _momoConfig = momoConfig.Value;
            _context = context;
            _logger = logger;
            _httpClient = httpClientFactory.CreateClient();
        }

        public async Task<string> CreatePaymentAsync(int invoiceId, string requestType)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
            if (invoice == null)
            {
                throw new Exception("Invoice not found.");
            }

            if (invoice.Status == "Paid")
            {
                throw new Exception("Invoice is already paid.");
            }

            var orderId = Guid.NewGuid().ToString();
            var requestId = Guid.NewGuid().ToString();
            var amount = (long)invoice.TotalAmount;
            var orderInfo = $"Thanh toan hoa don {invoiceId}";
            var extraData = invoiceId.ToString(); // Truyền invoiceId qua extraData thay vì parse chuỗi

            var rawHash = "accessKey=" + _momoConfig.AccessKey +
                          "&amount=" + amount +
                          "&extraData=" + extraData +
                          "&ipnUrl=" + _momoConfig.IpnUrl +
                          "&orderId=" + orderId +
                          "&orderInfo=" + orderInfo +
                          "&partnerCode=" + _momoConfig.PartnerCode +
                          "&redirectUrl=" + _momoConfig.ReturnUrl +
                          "&requestId=" + requestId +
                          "&requestType=" + requestType;

            var signature = ComputeHmacSha256(rawHash, _momoConfig.SecretKey);

            var request = new MomoCreatePaymentRequest
            {
                partnerCode = _momoConfig.PartnerCode,
                partnerName = "STMM Vendor",
                storeId = "STMM",
                requestId = requestId,
                amount = amount,
                orderId = orderId,
                orderInfo = orderInfo,
                redirectUrl = _momoConfig.ReturnUrl,
                ipnUrl = _momoConfig.IpnUrl,
                requestType = requestType, // captureWallet or payWithATM
                extraData = extraData,
                lang = "vi",
                signature = signature
            };

            var jsonRequest = JsonSerializer.Serialize(request);
            var content = new StringContent(jsonRequest, Encoding.UTF8, "application/json");

            var response = await _httpClient.PostAsync(_momoConfig.PaymentUrl, content);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                _logger.LogError($"MoMo API error: {error}");
                throw new Exception($"MoMo API Error: {error}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var momoResponse = JsonSerializer.Deserialize<MomoCreatePaymentResponse>(responseContent);

            if (momoResponse != null && !string.IsNullOrEmpty(momoResponse.payUrl))
            {
                // Lưu lại orderId map với invoiceId ở extraData hoặc lưu DB tạm nếu cần. Ở đây MoMo cho truyền qua orderId
                // Chúng ta dùng format orderId: {invoiceId}_{guid} để dễ split ra ở IPN
                return momoResponse.payUrl;
            }

            throw new Exception("Cannot get payUrl from MoMo.");
        }

        public async Task<bool> ProcessIpnAsync(MomoIPNRequest ipnRequest)
        {
            var rawHash = "accessKey=" + _momoConfig.AccessKey +
                          "&amount=" + ipnRequest.amount +
                          "&extraData=" + ipnRequest.extraData +
                          "&message=" + ipnRequest.message +
                          "&orderId=" + ipnRequest.orderId +
                          "&orderInfo=" + ipnRequest.orderInfo +
                          "&orderType=" + ipnRequest.orderType +
                          "&partnerCode=" + ipnRequest.partnerCode +
                          "&payType=" + ipnRequest.payType +
                          "&requestId=" + ipnRequest.requestId +
                          "&responseTime=" + ipnRequest.responseTime +
                          "&resultCode=" + ipnRequest.resultCode +
                          "&transId=" + ipnRequest.transId;

            var signature = ComputeHmacSha256(rawHash, _momoConfig.SecretKey);

            if (signature != ipnRequest.signature)
            {
                _logger.LogWarning("MoMo IPN signature mismatch!");
                return false;
            }

            if (ipnRequest.resultCode == 0)
            {
                // Lấy invoiceId từ extraData đã truyền ở CreatePayment
                if (int.TryParse(ipnRequest.extraData, out var invoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
                    if (invoice != null && invoice.Status != "Paid")
                    {
                        invoice.Status = "Paid";

                        if (invoice.InvoiceType == "Violation" && invoice.ViolationId.HasValue)
                        {
                            var violation = await _context.Violations.FirstOrDefaultAsync(v => v.ViolationId == invoice.ViolationId.Value);
                            if (violation != null)
                            {
                                violation.Status = "Paid";
                                violation.UpdatedAt = DateTime.UtcNow;
                            }
                        }
                        var payment = new Payment
                        {
                            InvoiceId = invoiceId,
                            Amount = ipnRequest.amount,
                            Method = ipnRequest.payType == "qr" ? "Momo - QR" : "Momo - ATM",
                            TransactionCode = ipnRequest.transId.ToString(),
                            PaidAt = DateTime.UtcNow,
                            Status = "Verified"
                        };
                        _context.Payments.Add(payment);

                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Invoice {invoiceId} marked as Paid via MoMo.");
                        return true;
                    }
                }
            }

            return false;
        }

        private string ComputeHmacSha256(string message, string secretKey)
        {
            var keyBytes = Encoding.UTF8.GetBytes(secretKey);
            var messageBytes = Encoding.UTF8.GetBytes(message);

            using (var hmacsha256 = new HMACSHA256(keyBytes))
            {
                var hashmessage = hmacsha256.ComputeHash(messageBytes);
                var hex = BitConverter.ToString(hashmessage);
                return hex.Replace("-", "").ToLower();
            }
        }
    }
}
