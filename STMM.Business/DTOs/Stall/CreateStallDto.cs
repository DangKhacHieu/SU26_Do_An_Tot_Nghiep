using System;
using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Stall
{
    public class CreateStallDto
    {
        [StringLength(50)]
        public string? Code { get; set; }

        [Required]
        public int AreaId { get; set; }

        public int? ElectricityMeterId { get; set; }
        public int? WaterMeterId { get; set; }

        public int? CategoryId { get; set; }

        [StringLength(100)]
        public string? CategoryName { get; set; }

        [StringLength(50)]
        public string? Status { get; set; } = "Available"; // Default status

        public double? Size { get; set; }

        public double? MapX { get; set; }

        public double? MapY { get; set; }

        public double? Width { get; set; }

        public double? Height { get; set; }

        public DateOnly? FireInsuranceExpiry { get; set; }
    }
}
