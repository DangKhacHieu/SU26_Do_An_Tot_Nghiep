namespace STMM.Business.DTOs.Faq
{
    public class UpdateFaqRequest
    {
        public string? Category { get; set; }
        public string Question { get; set; } = null!;
        public string Answer { get; set; } = null!;
        public bool? IsActive { get; set; }
    }
}
