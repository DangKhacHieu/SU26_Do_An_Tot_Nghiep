namespace STMM.Business.DTOs.BusinessCategory
{
    public class UpdateBusinessCategoryRequest
    {
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public bool IsActive { get; set; }
    }
}
