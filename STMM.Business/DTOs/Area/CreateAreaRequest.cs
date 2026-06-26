namespace STMM.Business.DTOs.Area
{
    public class CreateAreaRequest
    {
        public int MarketId { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public double? MinX { get; set; }
        public double? MinY { get; set; }
        public double? MaxX { get; set; }
        public double? MaxY { get; set; }
        public double? Size { get; set; }
    }
}
