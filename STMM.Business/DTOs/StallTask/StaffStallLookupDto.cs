namespace STMM.Business.DTOs.StallTask
{
    public class StaffStallLookupDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public string AreaName { get; set; } = string.Empty;
        public string? VendorName { get; set; }
        public string StallStatus { get; set; } = string.Empty;
    }
}
