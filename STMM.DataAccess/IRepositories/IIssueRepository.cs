using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IIssueRepository : IBaseRepository<Issue>
    {
        Task<IReadOnlyList<Issue>> GetIssuesForStaffAsync(
            int staffUserId,
            CancellationToken ct = default);

        Task<Issue?> GetIssueForStaffAsync(int issueId, int staffUserId, CancellationToken ct = default);

        Task<Issue?> GetIssueWithRelationsAsync(int issueId, bool tracking = false, CancellationToken ct = default);

        Task<bool> IsCreatorAsync(int issueId, int staffUserId, CancellationToken ct = default);

        Task<(IEnumerable<Issue> Items, int TotalCount)> GetIssuesForManagerPagedAsync(
            int marketId,
            string? status,
            string? searchTerm,
            bool sortDescending,
            int pageNumber,
            int pageSize,
            CancellationToken ct = default);

        Task<Issue?> GetIssueForManagerAsync(int issueId, int marketId, CancellationToken ct = default);
    }
}
