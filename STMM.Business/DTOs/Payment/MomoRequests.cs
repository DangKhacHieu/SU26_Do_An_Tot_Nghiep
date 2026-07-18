using System.Text.Json.Serialization;

namespace STMM.Business.DTOs.Payment
{
    public class MomoCreatePaymentRequest
    {
        public string? partnerCode { get; set; }
        public string? partnerName { get; set; }
        public string? storeId { get; set; }
        public string? requestId { get; set; }
        public long amount { get; set; }
        public string? orderId { get; set; }
        public string? orderInfo { get; set; }
        public string? redirectUrl { get; set; }
        public string? ipnUrl { get; set; }
        public string? requestType { get; set; }
        public string? extraData { get; set; }
        public string? lang { get; set; } = "vi";
        public string? signature { get; set; }
    }

    public class MomoCreatePaymentResponse
    {
        public string? partnerCode { get; set; }
        public string? orderId { get; set; }
        public string? requestId { get; set; }
        public long amount { get; set; }
        public long responseTime { get; set; }
        public string? message { get; set; }
        public int resultCode { get; set; }
        public string? payUrl { get; set; }
        public string? shortLink { get; set; }
    }

    public class MomoIPNRequest
    {
        public string? partnerCode { get; set; }
        public string? orderId { get; set; }
        public string? requestId { get; set; }
        public long amount { get; set; }
        public string? orderInfo { get; set; }
        public string? orderType { get; set; }
        public long transId { get; set; }
        public int resultCode { get; set; }
        public string? message { get; set; }
        public string? payType { get; set; }
        public long responseTime { get; set; }
        public string? extraData { get; set; }
        public string? signature { get; set; }
    }
}
