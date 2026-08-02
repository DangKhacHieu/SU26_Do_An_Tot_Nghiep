namespace STMM.Business.DTOs.Violation
{
    public class CreateViolationRequest
    {
        public int StallId { get; set; }
        public int ViolationTypeId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Microsoft.AspNetCore.Http.IFormFile? Image { get; set; }
        public decimal FineAmount { get; set; }
    }
}
