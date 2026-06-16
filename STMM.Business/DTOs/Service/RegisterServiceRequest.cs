using System;
using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Service;

public class RegisterServiceRequest
{
    [Required]
    public int ServiceId { get; set; }

    [Required]
    public int StallId { get; set; }
}
