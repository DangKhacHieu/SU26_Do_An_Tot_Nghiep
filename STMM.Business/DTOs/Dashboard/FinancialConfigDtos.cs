using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Dashboard
{
    // --- Fee Type DTOs ---
    public class FeeTypeDto
    {
        public int FeeTypeId { get; set; }
        public string Name { get; set; } = null!;
        public string? Unit { get; set; }
        public string? Description { get; set; }
    }

    public class CreateFeeTypeRequest
    {
        public string Name { get; set; } = null!;
        public string? Unit { get; set; }
        public string? Description { get; set; }
    }

    public class UpdateFeeTypeRequest
    {
        public string Name { get; set; } = null!;
        public string? Unit { get; set; }
        public string? Description { get; set; }
    }

    // --- Service DTOs ---
    public class ServiceDto
    {
        public int ServiceId { get; set; }
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? BillingCycle { get; set; }
        public int FeeTypeId { get; set; }
        public string FeeTypeName { get; set; } = string.Empty;
        public int CreatedByUserId { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateServiceRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? BillingCycle { get; set; }
        public int FeeTypeId { get; set; }
        public int CreatedByUserId { get; set; }
    }

    public class UpdateServiceRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public string? BillingCycle { get; set; }
        public int FeeTypeId { get; set; }
        public bool IsActive { get; set; }
    }

    // --- System Config DTOs ---
    public class SystemConfigDto
    {
        public int ConfigId { get; set; }
        public string ConfigKey { get; set; } = null!;
        public string ConfigValue { get; set; } = null!;
        public string? Description { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class UpdateSystemConfigRequest
    {
        public string ConfigKey { get; set; } = null!;
        public string ConfigValue { get; set; } = null!;
        public int UpdatedByUserId { get; set; }
    }

    // --- Tier DTOs ---
    public class UtilityTierStep
    {
        public int Step { get; set; }
        public double From { get; set; }
        public double? To { get; set; }
        public decimal Price { get; set; }
    }

    public class UpdateTiersRequest
    {
        public string ConfigKey { get; set; } = null!; // "electricity_tiers" or "water_tiers"
        public List<UtilityTierStep> Steps { get; set; } = new();
        public int UpdatedByUserId { get; set; }
    }
}
