using System;

namespace STMM.Business.DTOs.Service;

public class ServiceRegistrationDto
{
    public int RegistrationId { get; set; }
    public int ServiceId { get; set; }
    public string ServiceName { get; set; } = null!;
    public int StallId { get; set; }
    public string StallCode { get; set; } = null!;
    public string? Status { get; set; }
    public decimal Price { get; set; }
    public string? BillingCycle { get; set; }
    public DateTime? RegisteredAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsAutoRenew { get; set; }
}
