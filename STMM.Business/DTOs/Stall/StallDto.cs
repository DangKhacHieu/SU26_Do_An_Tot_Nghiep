using System;

namespace STMM.Business.DTOs.Stall
{
    public class StallDto
    {
        public int StallId { get; set; }
        public string Code { get; set; } = null!;
        public int AreaId { get; set; }
        public int CategoryId { get; set; }
        public string? Status { get; set; }
        public double? Size { get; set; }
        public double? MapX { get; set; }
        public double? MapY { get; set; }
        public double? Width { get; set; }
        public double? Height { get; set; }
        public double? Rotation { get; set; }
        public string? SvgPath { get; set; }
        public DateOnly? FireInsuranceExpiry { get; set; }
        public DateTime? CreatedAt { get; set; }
        
        // Navigation properties simplified
        public string? AreaName { get; set; }
        public string? CategoryName { get; set; }
    }
}
