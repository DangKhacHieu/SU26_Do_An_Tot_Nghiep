using System;

namespace STMM.Business.DTOs.Billing
{
    public class AutoGenerateHistoryDto
    {
        public int LogId { get; set; }
        public string Action { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public int InvoicesGenerated { get; set; }
    }
}
