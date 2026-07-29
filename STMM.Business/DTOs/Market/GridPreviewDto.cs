using System.Collections.Generic;

namespace STMM.Business.DTOs.Market
{
    public class GridPreviewRequest
    {
        public int Rows { get; set; }
        public int Cols { get; set; }
        public double AisleWidthPixels { get; set; }
        public string StartPoint { get; set; } = "TopLeft"; // TopLeft, TopRight, BottomLeft, BottomRight
        public string OrderStrategy { get; set; } = "RowMajor"; // RowMajor, ColMajor
        public string NamingStrategy { get; set; } = "Numeric"; // Numeric (Khu 1), Alphabetic (A, B), AlphaNumeric (A1, A2)
        public string Prefix { get; set; } = "";
        public List<double[]> PolygonPoints { get; set; } = new List<double[]>();
    }

    public class GridPreviewResponse
    {
        public double TotalAreaM2 { get; set; }
        public double UsableAreaM2 { get; set; }
        public double AisleAreaM2 { get; set; }
        public int Rows { get; set; }
        public int Cols { get; set; }
        public int TotalCells { get; set; }
        public int MaxAllowedZones { get; set; }
        public int GeneratedZones { get; set; }
        public double AverageZoneAreaM2 { get; set; }
        public bool IsValid { get; set; }
        public string? ErrorMessage { get; set; }
        
        public List<PreviewZoneDto> Zones { get; set; } = new List<PreviewZoneDto>();
    }

    public class PreviewZoneDto
    {
        public string Name { get; set; } = string.Empty;
        public double AreaM2 { get; set; }
        public List<double[]> Polygon { get; set; } = new List<double[]>();
    }
}
