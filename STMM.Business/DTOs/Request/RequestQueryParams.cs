namespace STMM.Business.DTOs.Request
{
    public class RequestQueryParams
    {
        public string? Status { get; set; }
        public string? RequestType { get; set; }
        public string? SearchTerm { get; set; }
        public int? StallId { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public bool SortDescending { get; set; } = true;
    }
}
