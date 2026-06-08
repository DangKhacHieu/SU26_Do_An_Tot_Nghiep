namespace STMM.Business.DTOs.Meter
{
    public class MeterReadingQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? MeterType { get; set; }
    }
}
