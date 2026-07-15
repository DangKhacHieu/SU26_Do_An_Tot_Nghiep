using System.Collections.Generic;

namespace STMM.Business.DTOs.Market
{
    public class CreateMarketBulkRequest
    {
        public string MarketName { get; set; } = null!;
        public string? Address { get; set; }
        public double? Size { get; set; }
        public string? SvgPath { get; set; }
        public double? MinX { get; set; }
        public double? MinY { get; set; }
        public double? MaxX { get; set; }
        public double? MaxY { get; set; }
        public List<CreateAreaBulkRequest> Areas { get; set; } = new List<CreateAreaBulkRequest>();
    }

    public class CreateAreaBulkRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public int? CategoryId { get; set; }
        public double? Size { get; set; }
        public string? SvgPath { get; set; }
        public double? MinX { get; set; }
        public double? MinY { get; set; }
        public double? MaxX { get; set; }
        public double? MaxY { get; set; }
        public List<CreateStallBulkRequest> Stalls { get; set; } = new List<CreateStallBulkRequest>();
    }

    public class CreateStallBulkRequest
    {
        public string Code { get; set; } = null!;
        public int CategoryId { get; set; }
        public string? Status { get; set; }
        public double? Size { get; set; }
        public double? MapX { get; set; }
        public double? MapY { get; set; }
        public double? Width { get; set; }
        public double? Height { get; set; }
        public double? Rotation { get; set; }
        public string? SvgPath { get; set; }
    }
}
