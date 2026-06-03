namespace STMM.Business.DTOs.Violation
{
    public class ViolationTypeDto
    {
        public int ViolationTypeId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? DefaultFine { get; set; }
        public bool? IsActive { get; set; }
    }
}
