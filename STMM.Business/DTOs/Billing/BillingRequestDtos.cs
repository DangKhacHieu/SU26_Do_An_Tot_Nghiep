using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Billing
{
    public class CreateAdHocInvoiceRequest
    {
        public int StallId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public DateOnly DueDate { get; set; }
        public decimal Amount { get; set; }
        public int FeeTypeId { get; set; }
        public string Description { get; set; } = null!;
    }

    public class BulkApproveInvoicesRequest
    {
        public List<int> InvoiceIds { get; set; } = new();
    }

    public class MeterReadingAdjustmentRequest
    {
        public int StallId { get; set; }
        public string MeterType { get; set; } = null!; // "Electricity" or "Water"
        public int Month { get; set; }
        public int Year { get; set; }
        public double OldValue { get; set; }
        public double NewValue { get; set; }
    }
}
