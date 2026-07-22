
using STMM.Business.DTOs.Dashboard;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Entities;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using ClosedXML.Excel;
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
        private readonly IUserRepository _userRepository;

        public DashboardService(
            IPaymentRepository paymentRepository,
            IInvoiceRepository invoiceRepository,
            IViolationRepository violationRepository,
            IUserRepository userRepository)
        {
            _paymentRepository = paymentRepository;
            _invoiceRepository = invoiceRepository;
            _violationRepository = violationRepository;
            _userRepository = userRepository;
        }

        public async Task<AccountantDashboardDto> GetAccountantDashboardDataAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            var now = DateTime.UtcNow;
            
            // 1. Calculate time periods
            var thisMonthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var nextMonthStart = thisMonthStart.AddMonths(1);
            
            var lastMonthStart = thisMonthStart.AddMonths(-1);
            var lastMonthEnd = thisMonthStart;

            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                if (user?.MarketId != null)
                {
                    marketId = user.MarketId;
                }
            }

            // 2. Revenue (actual cash received from Payments)
            var revenueThisMonth = await _paymentRepository.GetTotalRevenueAsync(thisMonthStart, nextMonthStart, marketId, ct);
            var revenueLastMonth = await _paymentRepository.GetTotalRevenueAsync(lastMonthStart, lastMonthEnd, marketId, ct);

            decimal revChange = 0;
            if (revenueLastMonth > 0)
            {
                revChange = ((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100;
            }
            string revChangeStr = revChange >= 0 ? $"+{revChange:F1}%" : $"{revChange:F1}%";

            // 3. Periodic Invoices (completed vs total)
            var invoicesTotal = await _invoiceRepository.CountInvoicesAsync(now.Month, now.Year, null, marketId, ct);
            var invoicesPaid = await _invoiceRepository.CountInvoicesAsync(now.Month, now.Year, "Paid", marketId, ct);
            var invoicesPaidLastMonth = await _invoiceRepository.CountInvoicesAsync(lastMonthStart.Month, lastMonthStart.Year, "Paid", marketId, ct);

            decimal invChange = 0;
            if (invoicesPaidLastMonth > 0)
            {
                invChange = ((decimal)(invoicesPaid - invoicesPaidLastMonth) / invoicesPaidLastMonth) * 100;
            }
            string invChangeStr = invChange >= 0 ? $"+{invChange:F1}%" : $"{invChange:F1}%";

            // 4. Repair Cost (invoice detail amount where fee category relates to repairs)
            var repairCostThisMonth = await _invoiceRepository.GetTotalRepairCostAsync(now.Month, now.Year, marketId, ct);
            var repairCostLastMonth = await _invoiceRepository.GetTotalRepairCostAsync(lastMonthStart.Month, lastMonthStart.Year, marketId, ct);

            decimal repChange = 0;
            if (repairCostLastMonth > 0)
            {
                repChange = ((repairCostThisMonth - repairCostLastMonth) / repairCostLastMonth) * 100;
            }
            string repChangeStr = repChange >= 0 ? $"+{repChange:F1}%" : $"{repChange:F1}%";

            // 5. Violations & Penalties Fines
            var finesThisMonth = await _violationRepository.GetTotalFinesAsync(thisMonthStart, nextMonthStart, marketId, ct);
            var finesLastMonth = await _violationRepository.GetTotalFinesAsync(lastMonthStart, lastMonthEnd, marketId, ct);

            decimal fineChange = 0;
            if (finesLastMonth > 0)
            {
                fineChange = ((finesThisMonth - finesLastMonth) / finesLastMonth) * 100;
            }
            string fineChangeStr = fineChange >= 0 ? $"+{fineChange:F1}%" : $"{fineChange:F1}%";

            // 6. Recent Transactions
            var recentPayments = await _paymentRepository.GetRecentPaymentsAsync(5, marketId, ct);

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
                var revenue = await _paymentRepository.GetTotalRevenueAsync(monthStart, monthEnd, marketId, ct);
                
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
        
        public async Task<byte[]> ExportDashboardReportAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            var data = await GetAccountantDashboardDataAsync(accountantUserId, ct);

            using var workbook = new XLWorkbook();
            
            // Sheet 1: Revenue Summary
            var wsRev = workbook.Worksheets.Add("Doanh Thu");
            wsRev.Cell("A1").Value = "BÁO CÁO TỔNG QUAN DOANH THU";
            wsRev.Range("A1:C1").Merge().Style.Font.SetBold().Font.SetFontSize(14);
            
            wsRev.Cell("A3").Value = "Chỉ số";
            wsRev.Cell("B3").Value = "Giá trị";
            wsRev.Cell("C3").Value = "Biến động";
            wsRev.Range("A3:C3").Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.LightGray);
            
            wsRev.Cell("A4").Value = "Doanh thu tháng này";
            wsRev.Cell("B4").Value = data.RevenueThisMonth;
            wsRev.Cell("C4").Value = data.RevenueChangePercent;
            
            wsRev.Cell("A5").Value = "Hóa đơn đã thu";
            wsRev.Cell("B5").Value = $"{data.InvoicesPaidCount} / {data.InvoicesTotalCount}";
            wsRev.Cell("C5").Value = data.InvoicesChangePercent;
            
            wsRev.Cell("A6").Value = "Chi phí sửa chữa";
            wsRev.Cell("B6").Value = data.RepairCostThisMonth;
            wsRev.Cell("C6").Value = data.RepairCostChangePercent;
            
            wsRev.Cell("A7").Value = "Tiền phạt vi phạm";
            wsRev.Cell("B7").Value = data.ViolationFinesThisMonth;
            wsRev.Cell("C7").Value = data.ViolationFinesChangePercent;
            
            wsRev.Columns().AdjustToContents();

            // Sheet 2: Recent Transactions
            var wsTrans = workbook.Worksheets.Add("Lịch Sử Giao Dịch");
            wsTrans.Cell("A1").Value = "LỊCH SỬ GIAO DỊCH GẦN ĐÂY";
            wsTrans.Range("A1:F1").Merge().Style.Font.SetBold().Font.SetFontSize(14);
            
            var transHeaders = new[] { "Mã Giao Dịch", "Tên Tiểu Thương", "Mã Sạp", "Số Tiền", "Phương Thức", "Trạng Thái", "Ngày Thu" };
            for(int i = 0; i < transHeaders.Length; i++)
            {
                wsTrans.Cell(3, i + 1).Value = transHeaders[i];
            }
            wsTrans.Range(3, 1, 3, transHeaders.Length).Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.LightGray);

            int row = 4;
            foreach (var tx in data.RecentTransactions)
            {
                wsTrans.Cell(row, 1).Value = tx.TransactionId;
                wsTrans.Cell(row, 2).Value = tx.TenantName;
                wsTrans.Cell(row, 3).Value = tx.StallCode;
                wsTrans.Cell(row, 4).Value = tx.Amount;
                wsTrans.Cell(row, 5).Value = tx.Type;
                wsTrans.Cell(row, 6).Value = tx.Status;
                wsTrans.Cell(row, 7).Value = tx.Date;
                row++;
            }
            wsTrans.Columns().AdjustToContents();
            
            // Sheet 3: Monthly Chart
            var wsChart = workbook.Worksheets.Add("Biểu Đồ Doanh Thu");
            wsChart.Cell("A1").Value = "BIỂU ĐỒ DOANH THU 12 THÁNG QUA";
            wsChart.Range("A1:C1").Merge().Style.Font.SetBold().Font.SetFontSize(14);
            
            wsChart.Cell("A3").Value = "Tháng/Năm";
            wsChart.Cell("B3").Value = "Doanh thu (VND)";
            wsChart.Cell("C3").Value = "Tỷ lệ (%)";
            wsChart.Range("A3:C3").Style.Font.SetBold().Fill.SetBackgroundColor(XLColor.LightGray);

            int chartRow = 4;
            foreach(var item in data.MonthlyRevenueChart)
            {
                wsChart.Cell(chartRow, 1).Value = item.Label;
                wsChart.Cell(chartRow, 2).Value = item.Amount;
                wsChart.Cell(chartRow, 3).Value = item.Value;
                chartRow++;
            }
            wsChart.Columns().AdjustToContents();

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            return stream.ToArray();
        }
    }
}
