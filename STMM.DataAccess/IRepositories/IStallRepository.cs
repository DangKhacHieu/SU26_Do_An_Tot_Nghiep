using STMM.DataAccess.Entities;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.DataAccess.IRepositories
{
    public record StallChecklistQueryResult(int StallId, string StallCode, string StallStatus, bool HasReadingThisMonth);

    public record StallTaskSummaryQueryResult(
        int StallId,
        string StallCode,
        string StallCategory,
        string StallStatus,
        string VendorName,
        string VendorPhone,
        bool HasUnpaidInvoice,
        int UnpaidInvoiceCount,
        decimal UnpaidTotalAmount,
        int PendingTaskCount,
        IEnumerable<string> PendingTaskTypes
    );

    public interface IStallRepository : IBaseRepository<Stall>
    {
        Task<(IEnumerable<StallTaskSummaryQueryResult> Items, int TotalCount)> GetStallTasksPagedAsync(
            int staffUserId,
            string? search,
            string? filter,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<List<StallChecklistQueryResult>> GetStallsChecklistByAreaAsync(int areaId, int year, int month, CancellationToken ct = default);
    }
}
