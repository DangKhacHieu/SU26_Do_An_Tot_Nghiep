namespace STMM.Business.DTOs.Meter
{
    public class MeterQueryParameters
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Type { get; set; }
        public bool? IsActive { get; set; }
        public bool? IsAssigned { get; set; }
        public string? Search { get; set; }
    }
}
