using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using STMM.DataAccess.Data;
using STMM.Business.DTOs.Billing;
using System.Security.Claims;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/vendor/invoices")]
    [Authorize]
    public class VendorInvoicesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VendorInvoicesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetVendorInvoices([FromQuery] int? stallId, [FromQuery] int? month, [FromQuery] int? year)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var query = _context.Invoices
                .Include(i => i.Contract)
                .ThenInclude(c => c.Stall)
                .Include(i => i.Contract.Vendor)
                .ThenInclude(v => v.User)
                .Include(i => i.InvoiceDetails)
                .ThenInclude(d => d.FeeType)
                .AsQueryable();

            // Lọc theo Vendor (BR-06)
            query = query.Where(i => i.Contract.Vendor.UserId == userId && i.Contract.Status == "Active");

            // Xóa mềm và chỉ lấy hóa đơn chính thức
            query = query.Where(i => i.IsDeleted != true && i.Contract.IsDeleted != true);
            query = query.Where(i => i.Status == "Unpaid" || i.Status == "Paid" || i.Status == "Overdue");

            if (stallId.HasValue && stallId.Value > 0)
            {
                query = query.Where(i => i.Contract.StallId == stallId.Value);
            }

            if (month.HasValue && month.Value > 0)
            {
                query = query.Where(i => i.Month == month.Value);
            }

            if (year.HasValue && year.Value > 0)
            {
                query = query.Where(i => i.Year == year.Value);
            }

            var invoices = await query
                .OrderByDescending(i => i.Year)
                .ThenByDescending(i => i.Month)
                .Select(i => new InvoiceDto
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
                    VendorName = i.Contract.Vendor.User != null ? i.Contract.Vendor.User.Name : "Unknown",
                    VendorPhone = i.Contract.Vendor.User != null ? i.Contract.Vendor.User.Phone : "",
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
                })
                .ToListAsync();

            return Ok(invoices);
        }
    }
}
