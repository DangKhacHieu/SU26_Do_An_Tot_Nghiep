using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.AuditLog;
using STMM.Business.Interfaces;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/admin/audit-logs")]
    [Authorize(Roles = "systemadmin,SystemAdmin,admin,Admin")]
    public class AdminAuditLogController : ControllerBase
    {
        private readonly IAuditLogService _auditLogService;

        public AdminAuditLogController(IAuditLogService auditLogService)
        {
            _auditLogService = auditLogService;
        }

        /// <summary>
        /// Lấy danh sách nhật ký hoạt động có lọc và phân trang (chỉ cho System Admin)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQueryParams queryParams, CancellationToken ct)
        {
            var result = await _auditLogService.GetAuditLogsAsync(queryParams, ct);
            return Ok(result);
        }
    }
}
