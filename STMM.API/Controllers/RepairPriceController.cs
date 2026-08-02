using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.RepairPrice;
using STMM.Business.Interfaces;
using STMM.API.Extensions;
using System.Threading;
using System.Threading.Tasks;
using System.Security.Claims;
using System;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/repair-prices")]
    [Authorize(Roles = "Accountant,Admin")]
    public class RepairPriceController : ControllerBase
    {
        private readonly IRepairPriceService _repairPriceService;
        private readonly IAuditLogService _auditLogService;

        public RepairPriceController(IRepairPriceService repairPriceService, IAuditLogService auditLogService)
        {
            _repairPriceService = repairPriceService;
            _auditLogService = auditLogService;
        }

        private int GetUserId()
        {
            var userId = User.GetUserId();
            if (!userId.HasValue)
            {
                throw new UnauthorizedAccessException("User ID not found in token.");
            }
            return userId.Value;
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
            var result = await _repairPriceService.GetRepairPriceByIdAsync(GetUserId(), id, ct);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRepairPrice([FromBody] CreateRepairPriceRequest request, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _repairPriceService.CreateRepairPriceAsync(userId, request, ct);
            
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Tạo bảng giá sửa chữa mới: {request.ItemName}", ipAddress, ct);
            
            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRepairPrice(int id, [FromBody] UpdateRepairPriceRequest request, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _repairPriceService.UpdateRepairPriceAsync(userId, id, request, ct);
            
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Cập nhật bảng giá sửa chữa (ID: {id})", ipAddress, ct);
            
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRepairPrice(int id, CancellationToken ct)
        {
            var userId = GetUserId();
            var result = await _repairPriceService.DeleteRepairPriceAsync(userId, id, ct);
            
            var ipAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString();
            await _auditLogService.LogAsync(userId, $"Xóa bảng giá sửa chữa (ID: {id})", ipAddress, ct);
            
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
