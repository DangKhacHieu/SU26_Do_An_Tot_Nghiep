using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Dashboard
{
    public class AccountantDashboardDto
    {
        public decimal RevenueThisMonth { get; set; }
        public string RevenueChangePercent { get; set; } = "0%";
        public bool IsRevenuePositive { get; set; } = true;
        
        public int InvoicesPaidCount { get; set; }
        public int InvoicesTotalCount { get; set; }
        public string InvoicesChangePercent { get; set; } = "0%";
        
        public decimal RepairCostThisMonth { get; set; }
        public string RepairCostChangePercent { get; set; } = "0%";
        public bool IsRepairCostPositive { get; set; } = false;
        
        public decimal ViolationFinesThisMonth { get; set; }
        public string ViolationFinesChangePercent { get; set; } = "0%";
        public bool IsViolationFinesPositive { get; set; } = true;
        
        public List<DashboardTransactionDto> RecentTransactions { get; set; } = new();
        public List<MonthlyRevenueChartDto> MonthlyRevenueChart { get; set; } = new();
    }

    public class DashboardTransactionDto
    {
        public string TransactionId { get; set; } = null!;
        public string StallCode { get; set; } = null!;
        public string TenantName { get; set; } = null!;
        public string Type { get; set; } = null!;
        public decimal Amount { get; set; }
        public string Status { get; set; } = null!;
        public string Date { get; set; } = null!;
    }

    public class MonthlyRevenueChartDto
    {
        public string Label { get; set; } = null!;
        public string Value { get; set; } = null!; // Percentage value for drawing the bar height (e.g. "80%")
        public decimal Amount { get; set; } // Actual revenue in VND
    }
}
