namespace STMM.Business.DTOs.Task
{
    public class UtilityStallChecklistDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public string StallStatus { get; set; } = null!;
        public bool HasReadingThisMonth { get; set; }
    }
}
