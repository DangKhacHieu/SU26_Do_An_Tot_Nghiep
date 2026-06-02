using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.StallTask;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IStallTaskService
    {
        /// <summary>
        /// UC-48: View List Stall Tasks — Xem danh sách các sạp có nhiệm vụ hoặc hóa đơn chưa thanh toán.
        /// </summary>
        Task<PagedResult<StallTaskSummaryDto>> GetStallTasksAsync(int staffUserId, StallTaskQueryParams queryParams, CancellationToken ct = default);
    }
}
