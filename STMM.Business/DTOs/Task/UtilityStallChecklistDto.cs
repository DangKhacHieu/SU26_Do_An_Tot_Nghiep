namespace STMM.Business.DTOs.Task
{
    public class UtilityStallChecklistDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public string StallStatus { get; set; } = null!;
        public bool HasElectricityMeter { get; set; }
        public bool HasWaterMeter { get; set; }
        public bool HasElectricityReadingThisMonth { get; set; }
        public bool HasWaterReadingThisMonth { get; set; }
        public bool HasReadingThisMonth { get; set; }
    }
}
