namespace STMM.Business.DTOs.Meter
{
    public class CreateMeterReadingRequest
    {
        public int MeterId { get; set; }
        public double NewValue { get; set; }
        public string RecordedAt { get; set; } = string.Empty;
        public Microsoft.AspNetCore.Http.IFormFile? Image { get; set; }
    }
}
