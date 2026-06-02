namespace STMM.Business.DTOs.Issue
{
    public class IssueQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? Status { get; set; }
        public bool SortDescending { get; set; } = true;
    }
}
