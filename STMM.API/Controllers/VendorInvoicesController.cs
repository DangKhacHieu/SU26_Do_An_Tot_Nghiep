using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using STMM.Business.Interfaces;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/vendor/invoices")]
    [Authorize]
    public class VendorInvoicesController : ControllerBase
    {
        private readonly IVendorInvoiceService _vendorInvoiceService;

        public VendorInvoicesController(IVendorInvoiceService vendorInvoiceService)
        {
            _vendorInvoiceService = vendorInvoiceService;
        }

        [HttpGet]
        public async Task<IActionResult> GetVendorInvoices([FromQuery] int? stallId, [FromQuery] int? month, [FromQuery] int? year, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10, CancellationToken ct = default)
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!int.TryParse(userIdStr, out int userId))
            {
                return Unauthorized(new { message = "Không xác định được danh tính người dùng." });
            }

            var invoices = await _vendorInvoiceService.GetVendorInvoicesAsync(userId, stallId, month, year, pageNumber, pageSize, ct);
            return Ok(invoices);
        }
    }
}
