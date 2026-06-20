using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Dashboard;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/accountant/config")]
    public class FinancialConfigController : ControllerBase
    {
        private readonly IFinancialConfigService _configService;

        public FinancialConfigController(IFinancialConfigService configService)
        {
            _configService = configService;
        }

        // --- FEE TYPES ---
        [HttpGet("fee-types")]
        public async Task<IActionResult> GetFeeTypes(CancellationToken ct)
        {
            var result = await _configService.GetFeeTypesAsync(ct);
            return Ok(result);
        }

        [HttpPost("fee-types")]
        public async Task<IActionResult> CreateFeeType([FromBody] CreateFeeTypeRequest request, CancellationToken ct)
        {
            var result = await _configService.CreateFeeTypeAsync(request, ct);
            return Ok(result);
        }

        [HttpPut("fee-types/{id}")]
        public async Task<IActionResult> UpdateFeeType(int id, [FromBody] UpdateFeeTypeRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateFeeTypeAsync(id, request, ct);
            return Ok(result);
        }

        [HttpDelete("fee-types/{id}")]
        public async Task<IActionResult> DeleteFeeType(int id, CancellationToken ct)
        {
            var result = await _configService.DeleteFeeTypeAsync(id, ct);
            return Ok(result);
        }

        // --- SERVICES ---
        [HttpGet("services")]
        public async Task<IActionResult> GetServices(CancellationToken ct)
        {
            var result = await _configService.GetServicesAsync(ct);
            return Ok(result);
        }

        [HttpPost("services")]
        public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request, CancellationToken ct)
        {
            var result = await _configService.CreateServiceAsync(request, ct);
            return Ok(result);
        }

        [HttpPut("services/{id}")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] UpdateServiceRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateServiceAsync(id, request, ct);
            return Ok(result);
        }

        [HttpDelete("services/{id}")]
        public async Task<IActionResult> DeleteService(int id, CancellationToken ct)
        {
            var result = await _configService.DeleteServiceAsync(id, ct);
            return Ok(result);
        }

        // --- SYSTEM CONFIGS ---
        [HttpGet("system-configs")]
        public async Task<IActionResult> GetSystemConfigs(CancellationToken ct)
        {
            var result = await _configService.GetSystemConfigsAsync(ct);
            return Ok(result);
        }

        [HttpPut("system-configs")]
        public async Task<IActionResult> UpdateSystemConfig([FromBody] UpdateSystemConfigRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateSystemConfigAsync(request, ct);
            return Ok(result);
        }

        // --- TIERS ---
        [HttpGet("tiers/{configKey}")]
        public async Task<IActionResult> GetTiers(string configKey, CancellationToken ct)
        {
            var result = await _configService.GetTiersAsync(configKey, ct);
            return Ok(result);
        }

        [HttpPut("tiers")]
        public async Task<IActionResult> UpdateTiers([FromBody] UpdateTiersRequest request, CancellationToken ct)
        {
            var result = await _configService.UpdateTiersAsync(request, ct);
            return Ok(result);
        }
    }
}
