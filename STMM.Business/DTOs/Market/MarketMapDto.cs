using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Market
{
    public class MarketMapDto
    {
        public int MarketId { get; set; }
        public string MarketName { get; set; } = null!;
        public string? Address { get; set; }
        public double? Size { get; set; }
        public string? SvgPath { get; set; }
        public double? MinX { get; set; }
        public double? MinY { get; set; }
        public double? MaxX { get; set; }
        public double? MaxY { get; set; }
        public string? Status { get; set; }
        public List<AreaMapDto> Areas { get; set; } = new List<AreaMapDto>();
    }

    public class AreaMapDto
    {
        public int AreaId { get; set; }
        public int MarketId { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public double? Size { get; set; }
        public string? SvgPath { get; set; }
        public double? MinX { get; set; }
        public double? MinY { get; set; }
        public double? MaxX { get; set; }
        public double? MaxY { get; set; }
        public List<StallMapDto> Stalls { get; set; } = new List<StallMapDto>();
    }

    public class StallMapDto
    {
        public int StallId { get; set; }
        public string Code { get; set; } = null!;
        public int AreaId { get; set; }
        public string? AreaName { get; set; }
        public int? CategoryId { get; set; }
        public string? CategoryName { get; set; }
        public string? Status { get; set; }
        public double? Size { get; set; }
        public double? MapX { get; set; }
        public double? MapY { get; set; }
        public double? Width { get; set; }
        public double? Height { get; set; }
        public double? Rotation { get; set; }
        public string? SvgPath { get; set; }
        public DateOnly? FireInsuranceExpiry { get; set; }
        public string? BusinessName { get; set; }
    }
}
