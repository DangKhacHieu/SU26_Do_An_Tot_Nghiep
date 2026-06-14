namespace STMM.Business.DTOs.Faq
{
    public class CreateFaqRequest
    {
        public string? Category { get; set; }
        public string Question { get; set; } = null!;
        public string Answer { get; set; } = null!;
        public int? CreatedByUserId { get; set; }
        public bool? IsActive { get; set; } = true;
    }
}
