using System;

namespace STMM.Business.DTOs.Faq
{
    public class FaqDto
    {
        public int FaqId { get; set; }
        public string? Category { get; set; }
        public string Question { get; set; } = null!;
        public string Answer { get; set; } = null!;
        public int CreatedByUserId { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
}
