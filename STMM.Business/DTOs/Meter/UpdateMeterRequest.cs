namespace STMM.Business.DTOs.Meter
{
    public class UpdateMeterRequest
    {
        public string SerialNumber { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
