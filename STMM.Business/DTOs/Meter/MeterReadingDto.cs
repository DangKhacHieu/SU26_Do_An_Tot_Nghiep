namespace STMM.Business.DTOs.Meter
{
    public class MeterReadingDto
    {
        public int MeterReadingId { get; set; }
        public int MeterId { get; set; }
        public string MeterSerialNumber { get; set; } = string.Empty;
        public string MeterType { get; set; } = string.Empty;
        public string StallCode { get; set; } = string.Empty;
        public double OldValue { get; set; }
        public double NewValue { get; set; }
        public double Consumption => NewValue - OldValue;
        public string RecordedAt { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
    }
}
