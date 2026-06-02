using System.Collections.Generic;
using System.Linq;

namespace STMM.Business.DTOs.StallTask
{
    public class StallTaskSummaryDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = string.Empty;
        public string? StallCategory { get; set; }
        public string StallStatus { get; set; } = string.Empty;
        public string VendorName { get; set; } = string.Empty;
        public string VendorPhone { get; set; } = string.Empty;
        public bool HasUnpaidInvoice { get; set; }
        public int UnpaidInvoiceCount { get; set; }
        public decimal UnpaidTotalAmount { get; set; }
        public int PendingTaskCount { get; set; }
        public IEnumerable<string> TaskTypes { get; set; } = Enumerable.Empty<string>();
    }
}
