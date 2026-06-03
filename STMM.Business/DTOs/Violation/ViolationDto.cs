namespace STMM.Business.DTOs.Violation
{
    public class ViolationDto
    {
        public int ViolationId { get; set; }
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public int CreatedBy { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string ImageUrl { get; set; } = string.Empty;
        public decimal FineAmount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? NotifiedAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
