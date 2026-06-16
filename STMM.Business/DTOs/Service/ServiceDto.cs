using System;

namespace STMM.Business.DTOs.Service;

public class ServiceDto
{
    public int ServiceId { get; set; }
    public string Name { get; set; } = null!;
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public string? BillingCycle { get; set; }
    public int FeeTypeId { get; set; }
}
