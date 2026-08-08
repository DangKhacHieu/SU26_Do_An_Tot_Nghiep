namespace STMM.Business.DTOs.Market
{
    public class DeactivateMarketResult
    {
        public int MarketId { get; set; }
        public string MarketName { get; set; } = string.Empty;
        public int AffectedUserCount { get; set; }
        public string Message =>
            $"Chợ '{MarketName}' đã ngưng hoạt động. {AffectedUserCount} tài khoản đã được gỡ liên kết khỏi chợ này.";
    }
}
