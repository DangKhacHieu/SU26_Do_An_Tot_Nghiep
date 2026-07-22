using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.RepairPrice;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Claims;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/repair-prices")]
    [Authorize(Roles = "Accountant,Admin")]
    public class RepairPriceController : ControllerBase
    {
        private readonly IRepairPriceService _repairPriceService;

        public RepairPriceController(IRepairPriceService repairPriceService)
        {
            _repairPriceService = repairPriceService;
        }

        private int GetUserId()
        {
            if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out int userId))
            {
                return 0;
            }
            return userId;
        }

        [HttpGet]
        public async Task<IActionResult> GetRepairPrices(CancellationToken ct)
        {
            var result = await _repairPriceService.GetRepairPricesAsync(GetUserId(), ct);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRepairPriceById(int id, CancellationToken ct)
        {
            var result = await _repairPriceService.GetRepairPriceByIdAsync(id, ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRepairPrice([FromBody] CreateRepairPriceRequest request, CancellationToken ct)
        {
            var result = await _repairPriceService.CreateRepairPriceAsync(GetUserId(), request, ct);
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRepairPrice(int id, [FromBody] UpdateRepairPriceRequest request, CancellationToken ct)
        {
            var result = await _repairPriceService.UpdateRepairPriceAsync(id, request, ct);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRepairPrice(int id, CancellationToken ct)
        {
            var result = await _repairPriceService.DeleteRepairPriceAsync(id, ct);
            return Ok(result);
        }

        [HttpGet("used-tools")]
        public async Task<IActionResult> GetUsedTools(CancellationToken ct)
        {
            var result = await _repairPriceService.GetUsedRepairToolsAsync(GetUserId(), ct);
            return Ok(result);
        }
    }
}
