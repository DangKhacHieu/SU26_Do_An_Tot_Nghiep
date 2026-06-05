using Microsoft.AspNetCore.Mvc;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/repair-prices")]
    public class RepairPricesController : ControllerBase
    {
        private readonly IQuotationService _quotationService;

        public RepairPricesController(IQuotationService quotationService)
        {
            _quotationService = quotationService;
        }

        /// <summary>
        /// UC-Select-Repair-Materials: Lấy danh sách vật tư từ catalog repair_prices.
        /// Staff dùng để chọn vật tư khi lập báo giá; Manager dùng để tham khảo đơn giá.
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetRepairPrices(CancellationToken ct)
        {
            var result = await _quotationService.GetRepairPricesAsync(ct);
            return Ok(result);
        }
    }
}
