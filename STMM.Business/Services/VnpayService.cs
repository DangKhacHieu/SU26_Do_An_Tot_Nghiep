using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using STMM.Business.DTOs.Payment;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;

namespace STMM.Business.Services
{
    public class VnpayService : IVnpayService
    {
        private readonly VnpayConfig _vnpayConfig;
        private readonly AppDbContext _context;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly ILogger<VnpayService> _logger;

        public VnpayService(
            IOptions<VnpayConfig> vnpayConfig,
            AppDbContext context,
            IHttpContextAccessor httpContextAccessor,
            ILogger<VnpayService> logger)
        {
            _vnpayConfig = vnpayConfig.Value;
            _context = context;
            _httpContextAccessor = httpContextAccessor;
            _logger = logger;
        }

        public async Task<string> CreatePaymentUrlAsync(int invoiceId)
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

            var httpContext = _httpContextAccessor.HttpContext;
            var ipAddress = httpContext?.Connection?.RemoteIpAddress?.ToString() ?? "127.0.0.1";

            // Standardize IP Address to avoid IPv6 loopback issue for VNPay
            if (ipAddress == "::1")
            {
                ipAddress = "127.0.0.1";
            }

            var vnpay = new VnpayLibrary();
            var amount = (long)(invoice.TotalAmount * 100);
            var txnRef = $"{invoiceId}_{DateTime.UtcNow.Ticks}";

            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", _vnpayConfig.TmnCode);
            vnpay.AddRequestData("vnp_Amount", amount.ToString());
            vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", ipAddress);
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan hoa don {invoiceId}");
            vnpay.AddRequestData("vnp_OrderType", "billpayment");
            vnpay.AddRequestData("vnp_ReturnUrl", _vnpayConfig.ReturnUrl);
            vnpay.AddRequestData("vnp_TxnRef", txnRef);

            var paymentUrl = vnpay.CreateRequestUrl(_vnpayConfig.PaymentUrl, _vnpayConfig.HashSecret);
            _logger.LogInformation($"[DEBUG VNPay URL] {paymentUrl}");
            return paymentUrl;
        }

        public async Task<bool> ProcessIpnAsync(Dictionary<string, string> queryParams)
        {
            var vnpay = new VnpayLibrary();
            string vnp_SecureHash = string.Empty;

            foreach (var kv in queryParams)
            {
                if (kv.Key == "vnp_SecureHash")
                {
                    vnp_SecureHash = kv.Value;
                }
                else if (kv.Key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(kv.Key, kv.Value);
                }
            }

            if (string.IsNullOrEmpty(vnp_SecureHash))
            {
                _logger.LogWarning("VNPay secure hash not found in query parameters.");
                return false;
            }

            bool isValidSignature = vnpay.ValidateSignature(vnp_SecureHash, _vnpayConfig.HashSecret);
            if (!isValidSignature)
            {
                _logger.LogWarning("VNPay signature verification failed.");
                return false;
            }

            string txnRef = queryParams.TryGetValue("vnp_TxnRef", out var refVal) ? refVal : string.Empty;
            string responseCode = queryParams.TryGetValue("vnp_ResponseCode", out var codeVal) ? codeVal : string.Empty;
            string transactionStatus = queryParams.TryGetValue("vnp_TransactionStatus", out var statusVal) ? statusVal : string.Empty;
            string transactionNo = queryParams.TryGetValue("vnp_TransactionNo", out var transVal) ? transVal : string.Empty;
            string amountStr = queryParams.TryGetValue("vnp_Amount", out var amtVal) ? amtVal : string.Empty;

            if (responseCode == "00" && transactionStatus == "00")
            {
                var parts = txnRef.Split('_');
                if (parts.Length > 0 && int.TryParse(parts[0], out int invoiceId))
                {
                    var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.InvoiceId == invoiceId);
                    if (invoice != null)
                    {
                        if (invoice.Status == "Paid")
                        {
                            _logger.LogInformation($"Invoice {invoiceId} is already updated to Paid status.");
                            return true; // Already processed, return true for idempotency
                        }

                        invoice.Status = "Paid";

                        long.TryParse(amountStr, out long vnpAmount);
                        decimal actualAmount = (decimal)vnpAmount / 100;

                        var payment = new Payment
                        {
                            InvoiceId = invoiceId,
                            Amount = actualAmount,
                            Method = "VNPay",
                            TransactionCode = transactionNo,
                            PaidAt = DateTime.UtcNow
                        };

                        _context.Payments.Add(payment);
                        await _context.SaveChangesAsync();
                        _logger.LogInformation($"Invoice {invoiceId} has been successfully paid via VNPay. Payment record saved.");
                        return true;
                    }
                    else
                    {
                        _logger.LogWarning($"Invoice with ID {invoiceId} was not found.");
                    }
                }
            }
            else
            {
                _logger.LogWarning($"VNPay transaction failed. ResponseCode: {responseCode}, Status: {transactionStatus}");
            }

            return false;
        }
    }

    public class VnpayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayCompare());
        private readonly SortedList<string, string> _responseData = new SortedList<string, string>(new VnPayCompare());

        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public void AddResponseData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _responseData.Add(key, value);
            }
        }

        public string GetResponseData(string key)
        {
            return _responseData.TryGetValue(key, out var val) ? val : string.Empty;
        }

        public string CreateRequestUrl(string baseUrl, string vnpHashSecret)
        {
            var data = new StringBuilder();
            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }
            var result = data.ToString();
            if (result.Length > 0)
            {
                result = result.Remove(result.Length - 1);
            }

            var signData = GetSignData();
            var vnpSecureHash = HmacSha512(vnpHashSecret, signData);
            
            var requestUrl = baseUrl + "?" + result + "&vnp_SecureHash=" + vnpSecureHash;
            return requestUrl;
        }

        private string GetSignData()
        {
            var signData = new StringBuilder();
            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    signData.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }
            var result = signData.ToString();
            if (result.Length > 0)
            {
                result = result.Remove(result.Length - 1);
            }
            return result;
        }

        public bool ValidateSignature(string inputHash, string secretKey)
        {
            var rspRaw = GetResponseDataForSign();
            var myChecksum = HmacSha512(secretKey, rspRaw);
            return myChecksum.Equals(inputHash, StringComparison.InvariantCultureIgnoreCase);
        }

        private string GetResponseDataForSign()
        {
            var data = new StringBuilder();
            foreach (var kv in _responseData)
            {
                if (!kv.Key.StartsWith("vnp_SecureHash"))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }
            var result = data.ToString();
            if (result.Length > 0)
            {
                result = result.Remove(result.Length - 1);
            }
            return result;
        }

        private string HmacSha512(string key, string inputData)
        {
            var hash = new StringBuilder();
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var inputBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmac = new HMACSHA512(keyBytes))
            {
                var hashValue = hmac.ComputeHash(inputBytes);
                foreach (var theByte in hashValue)
                {
                    hash.Append(theByte.ToString("x2"));
                }
            }
            return hash.ToString();
        }
    }

    public class VnPayCompare : IComparer<string>
    {
        public int Compare(string? x, string? y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}
