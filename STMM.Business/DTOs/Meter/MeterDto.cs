namespace STMM.Business.DTOs.Meter
{
    public class MeterDto
    {
        public int MeterId { get; set; }
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string SerialNumber { get; set; } = string.Empty;
        public string? InstalledAt { get; set; }
        public bool? IsActive { get; set; }
        public double? LastReadingValue { get; set; }
    }
}
