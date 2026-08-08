using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Common;
using STMM.Business.Exceptions;
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

        public async Task<PagedResult<InvoiceDto>> GetVendorInvoicesAsync(int userId, int? stallId, int? month, int? year, int pageNumber, int pageSize, CancellationToken ct = default)
        {
            // Business Validations
            if (stallId.HasValue && stallId.Value <= 0)
                throw new BadRequestException("ERR_ID_SAP_KHONG_HOP_LE");

            if (month.HasValue && (month.Value < 1 || month.Value > 12))
                throw new BadRequestException("ERR_THANG_PHAI_NAM_TRONG_KHOANG_TU_1_DEN_12");

            if (year.HasValue && (year.Value < 2000 || year.Value > System.DateTime.Now.Year + 1))
                throw new BadRequestException($"ERR_NAM_KHONG_HOP_LE_VUI_LONG_NHAP_TU_NAM_2000_DEN_SYS|{System.DateTime.Now.Year + 1}");

            if (pageNumber <= 0) pageNumber = 1;
            if (pageSize <= 0 || pageSize > 100) pageSize = 10;

            var (items, totalCount) = await _invoiceRepository.GetInvoicesByVendorPagedAsync(userId, stallId, month, year, pageNumber, pageSize, ct);

            var dtos = items.Select(i => new InvoiceDto
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

            return new PagedResult<InvoiceDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = pageNumber,
                PageSize = pageSize
            };
        }
    }
}
