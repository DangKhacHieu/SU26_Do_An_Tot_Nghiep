using System;
using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Stall
{
    public class UpdateStallDto
    {
        [Required]
        [StringLength(50)]
        public string Code { get; set; } = null!;

        public int? CategoryId { get; set; }

        [StringLength(100)]
        public string? CategoryName { get; set; }

        public double? Size { get; set; }

        public DateOnly? FireInsuranceExpiry { get; set; }
    }
}
