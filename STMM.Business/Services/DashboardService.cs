using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Dashboard;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IPaymentRepository _paymentRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IViolationRepository _violationRepository;

        public DashboardService(
            IPaymentRepository paymentRepository,
            IInvoiceRepository invoiceRepository,
            IViolationRepository violationRepository)
        {
            _paymentRepository = paymentRepository;
            _invoiceRepository = invoiceRepository;
            _violationRepository = violationRepository;
        }

        public async Task<AccountantDashboardDto> GetAccountantDashboardDataAsync(CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            
            // 1. Calculate time periods
            var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var nextMonthStart = thisMonthStart.AddMonths(1);
            
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart;

            // 2. Revenue (actual cash received from Payments)
            var revenueThisMonth = await _paymentRepository.Query()
                .Where(p => p.PaidAt >= thisMonthStart && p.PaidAt < nextMonthStart)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0;

            var revenueLastMonth = await _paymentRepository.Query()
                .Where(p => p.PaidAt >= lastMonthStart && p.PaidAt < lastMonthEnd)
                .SumAsync(p => (decimal?)p.Amount, ct) ?? 0;

            decimal revChange = 0;
            if (revenueLastMonth > 0)
            {
                revChange = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
            }
            string revChangeStr = revChange >= 0 ? $"+{revChange:F1}%" : $"{revChange:F1}%";

            // 3. Periodic Invoices (completed vs total)
            var invoicesTotal = await _invoiceRepository.Query()
                .Where(i => i.Month == now.Month && i.Year == now.Year)
                .CountAsync(ct);

            var invoicesPaid = await _invoiceRepository.Query()
                .Where(i => i.Month == now.Month && i.Year == now.Year && i.Status == "Paid")
                .CountAsync(ct);

            var invoicesPaidLastMonth = await _invoiceRepository.Query()
                .Where(i => i.Month == lastMonthStart.Month && i.Year == lastMonthStart.Year && i.Status == "Paid")
                .CountAsync(ct);

            decimal invChange = 0;
            if (invoicesPaidLastMonth > 0)
            {
                invChange = ((decimal)(invoicesPaid - invoicesPaidLastMonth) / invoicesPaidLastMonth) * 100;
            }
            string invChangeStr = invChange >= 0 ? $"+{invChange:F1}%" : $"{invChange:F1}%";

            // 4. Repair Cost (invoice detail amount where fee category relates to repairs)
            var repairCostThisMonth = await _invoiceRepository.Query()
                .Where(i => i.Month == now.Month && i.Year == now.Year)
                .SelectMany(i => i.InvoiceDetails)
                .Where(d => d.FeeType.Name.ToLower().Contains("sửa") || 
                            d.FeeType.Name.ToLower().Contains("repair") || 
                            d.Description!.ToLower().Contains("sửa"))
                .SumAsync(d => (decimal?)d.Amount, ct) ?? 0;

            var repairCostLastMonth = await _invoiceRepository.Query()
                .Where(i => i.Month == lastMonthStart.Month && i.Year == lastMonthStart.Year)
                .SelectMany(i => i.InvoiceDetails)
                .Where(d => d.FeeType.Name.ToLower().Contains("sửa") || 
                            d.FeeType.Name.ToLower().Contains("repair") || 
                            d.Description!.ToLower().Contains("sửa"))
                .SumAsync(d => (decimal?)d.Amount, ct) ?? 0;

            decimal repChange = 0;
            if (repairCostLastMonth > 0)
            {
                repChange = ((repairCostThisMonth - repairCostLastMonth) / repairCostLastMonth) * 100;
            }
            string repChangeStr = repChange >= 0 ? $"+{repChange:F1}%" : $"{repChange:F1}%";

            // 5. Violations & Penalties Fines
            var finesThisMonth = await _violationRepository.Query()
                .Where(v => v.CreatedAt >= thisMonthStart && v.CreatedAt < nextMonthStart)
                .SumAsync(v => v.FineAmount ?? 0, ct);

            var finesLastMonth = await _violationRepository.Query()
                .Where(v => v.CreatedAt >= lastMonthStart && v.CreatedAt < lastMonthEnd)
                .SumAsync(v => v.FineAmount ?? 0, ct);

            decimal fineChange = 0;
            if (finesLastMonth > 0)
            {
                fineChange = ((finesThisMonth - finesLastMonth) / finesLastMonth) * 100;
            }
            string fineChangeStr = fineChange >= 0 ? $"+{fineChange:F1}%" : $"{fineChange:F1}%";

            // 6. Recent Transactions
            var recentPayments = await _paymentRepository.Query()
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Stall)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                            .ThenInclude(v => v.User)
                .OrderByDescending(p => p.PaidAt)
                .Take(5)
                .ToListAsync(ct);

            var transactionsList = recentPayments.Select(p => new DashboardTransactionDto
            {
                TransactionId = $"PAY-{p.PaymentId:D3}",
                StallCode = p.Invoice?.Contract?.Stall?.Code ?? "N/A",
                TenantName = p.Invoice?.Contract?.Vendor?.User?.Name ?? p.Invoice?.Contract?.Vendor?.BusinessName ?? "N/A",
                Type = p.Invoice != null ? $"Hóa đơn Th.{p.Invoice.Month}/{p.Invoice.Year}" : "Thanh toán dịch vụ",
                Amount = p.Amount,
                Status = p.Invoice?.Status ?? "Success",
                Date = p.PaidAt.HasValue ? p.PaidAt.Value.ToString("dd/MM/yyyy HH:mm") : "N/A"
            }).ToList();

            // 7. Monthly Revenue Chart (Last 6 Months)
            var monthlyChartList = new List<MonthlyRevenueChartDto>();
            var chartMonths = new List<DateTime>();
            for (int i = 5; i >= 0; i--)
            {
                chartMonths.Add(thisMonthStart.AddMonths(-i));
            }

            var monthlyAmounts = new List<decimal>();
            foreach (var monthStart in chartMonths)
            {
                var monthEnd = monthStart.AddMonths(1);
                var revenue = await _paymentRepository.Query()
                    .Where(p => p.PaidAt >= monthStart && p.PaidAt < monthEnd)
                    .SumAsync(p => (decimal?)p.Amount, ct) ?? 0;
                
                monthlyAmounts.Add(revenue);
                
                monthlyChartList.Add(new MonthlyRevenueChartDto
                {
                    Label = $"Th.{monthStart.Month}",
                    Amount = revenue,
                    Value = "0%" // Placeholder, will compute percentage after finding Max
                });
            }

            decimal maxAmount = monthlyAmounts.Count > 0 ? monthlyAmounts.Max() : 0;
            if (maxAmount > 0)
            {
                for (int i = 0; i < monthlyChartList.Count; i++)
                {
                    var percentage = (monthlyChartList[i].Amount / maxAmount) * 100;
                    monthlyChartList[i].Value = $"{percentage:F0}%";
                }
            }

            // Assemble DTO
            return new AccountantDashboardDto
            {
                RevenueThisMonth = revenueThisMonth,
                RevenueChangePercent = revChangeStr,
                IsRevenuePositive = revChange >= 0,
                
                InvoicesPaidCount = invoicesPaid,
                InvoicesTotalCount = invoicesTotal,
                InvoicesChangePercent = invChangeStr,
                
                RepairCostThisMonth = repairCostThisMonth,
                RepairCostChangePercent = repChangeStr,
                IsRepairCostPositive = repChange >= 0,
                
                ViolationFinesThisMonth = finesThisMonth,
                ViolationFinesChangePercent = fineChangeStr,
                IsViolationFinesPositive = fineChange >= 0,
                
                RecentTransactions = transactionsList,
                MonthlyRevenueChart = monthlyChartList
            };
        }
    }
}
