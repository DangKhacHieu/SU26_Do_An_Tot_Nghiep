using System;

namespace STMM.Business.DTOs.Market
{
    public class MarketDto
    {
        public int MarketId { get; set; }
        public string MarketName { get; set; } = null!;
        public string? Address { get; set; }
        public double? Size { get; set; }
        public int AreasCount { get; set; }
        public int StallsCount { get; set; }
    }
}
