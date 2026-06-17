namespace STMM.Business.DTOs.Violation
{
    public class ViolationQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public string? Status { get; set; }
        public string? SearchTerm { get; set; }
        public bool SortDescending { get; set; } = true;
    }
}
