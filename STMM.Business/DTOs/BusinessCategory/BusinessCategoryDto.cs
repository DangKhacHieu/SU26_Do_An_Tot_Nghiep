using System;

namespace STMM.Business.DTOs.BusinessCategory
{
    public class BusinessCategoryDto
    {
        public int CategoryId { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int StallsCount { get; set; }
        public int AreasCount { get; set; }
    }
}
