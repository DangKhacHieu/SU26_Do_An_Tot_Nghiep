using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Billing;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class VendorInvoiceService : IVendorInvoiceService
    {
        private readonly IInvoiceRepository _invoiceRepository;

        public VendorInvoiceService(IInvoiceRepository invoiceRepository)
        {
            _invoiceRepository = invoiceRepository;
        }

        public async Task<IEnumerable<InvoiceDto>> GetVendorInvoicesAsync(int userId, int? stallId, int? month, int? year, CancellationToken ct = default)
        {
            var invoices = await _invoiceRepository.GetInvoicesByVendorAsync(userId, stallId, month, year, ct);

            return invoices.Select(i => new InvoiceDto
            {
                InvoiceId = i.InvoiceId,
                ContractId = i.ContractId,
                Month = i.Month,
                Year = i.Year,
                TotalAmount = i.TotalAmount,
                Status = i.Status ?? "Unpaid",
                DueDate = i.DueDate,
                CreatedAt = i.CreatedAt,
                StallId = i.Contract.StallId,
                StallCode = i.Contract.Stall.Code,
                StallCategory = i.Contract.Stall.CategoryId.ToString(),
                VendorName = i.Contract.Vendor?.User != null ? i.Contract.Vendor.User.Name : "Unknown",
                VendorPhone = i.Contract.Vendor?.User != null ? i.Contract.Vendor.User.Phone : "",
                Details = i.InvoiceDetails.Select(d => new InvoiceDetailDto
                {
                    InvoiceDetailId = d.InvoiceDetailId,
                    FeeTypeId = d.FeeTypeId,
                    FeeTypeName = d.FeeType != null ? d.FeeType.Name : "N/A",
                    Description = d.Description,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    Amount = d.Amount
                }).ToList()
            });
        }
    }
}
