namespace STMM.Business.DTOs.Stall
{
    public class HighestRatedStallDto
    {
        public int StallId { get; set; }
        public string Code { get; set; } = null!;
        public string AreaName { get; set; } = null!;
        public string CategoryName { get; set; } = null!;
        public double AverageRating { get; set; }
        public double? Size { get; set; }
    }
}
