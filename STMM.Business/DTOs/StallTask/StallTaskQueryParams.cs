namespace STMM.Business.DTOs.StallTask
{
    public class StallTaskQueryParams
    {
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string Filter { get; set; } = "All"; // "All" | "HasUnpaidInvoice" | "HasTask"
        public string? Search { get; set; } // search by StallCode
    }
}
