using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IIssueRepository : IBaseRepository<Issue>
    {
        Task<(IEnumerable<Issue> Items, int TotalCount)> GetIssuesPagedAsync(
            int staffUserId,
            List<int> assignedIssueIds,
            string? status,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Issue?> GetIssueWithRelationsAsync(int issueId, bool tracking = false, CancellationToken ct = default);

        Task<bool> IsCreatorAsync(int issueId, int staffUserId, CancellationToken ct = default);

        Task<(IEnumerable<Issue> Items, int TotalCount)> GetIssuesForManagerPagedAsync(
            string? status,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);
    }
}
