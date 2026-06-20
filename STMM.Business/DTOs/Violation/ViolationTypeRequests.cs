using System;

namespace STMM.Business.DTOs.Violation
{
    public class CreateViolationTypeRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal DefaultFine { get; set; }
    }

    public class UpdateViolationTypeRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public decimal DefaultFine { get; set; }
        public bool IsActive { get; set; }
    }
}
