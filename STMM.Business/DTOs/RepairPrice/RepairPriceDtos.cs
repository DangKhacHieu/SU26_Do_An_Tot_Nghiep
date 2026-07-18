using System;

namespace STMM.Business.DTOs.RepairPrice
{
    public class RepairPriceDto
    {
        public int RepairPriceId { get; set; }
        public string ItemName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
        public int UsageCount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateRepairPriceRequest
    {
        public string ItemName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateRepairPriceRequest
    {
        public string ItemName { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public decimal Price { get; set; }
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }

    public class UsedRepairToolDto
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public string TaskTitle { get; set; } = null!;
        public string AssignedToStaff { get; set; } = null!;
        public int RepairPriceId { get; set; }
        public string ItemName { get; set; } = null!;
        public double Quantity { get; set; }
        public string Unit { get; set; } = null!;
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
        public DateTime? UsedDate { get; set; }
    }
}
