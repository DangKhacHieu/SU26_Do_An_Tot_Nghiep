using STMM.Business.DTOs.AuditLog;
using STMM.Business.DTOs.Common;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IAuditLogService
    {
        /// <summary>
        /// Ghi nhận một hành động của người dùng vào Audit Log
        /// </summary>
        Task LogAsync(int userId, string action, string? ipAddress, CancellationToken ct = default);

        /// <summary>
        /// Lấy danh sách nhật ký hoạt động có lọc và phân trang
        /// </summary>
        Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogQueryParams queryParams, CancellationToken ct = default);
    }
}
