namespace STMM.Business.DTOs.Meter
{
    public class CreateMeterRequest
    {
        public string SerialNumber { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }
}
