using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Issue;

namespace STMM.Business.Interfaces
{
    public interface IIssueService
    {
        Task<IReadOnlyList<IssueDto>> GetIssuesAsync(int staffUserId, CancellationToken ct = default);
        Task<IssueDto> GetIssueByIdAsync(int issueId, int staffUserId, CancellationToken ct = default);
        Task<IssueDto> CreateIssueAsync(int staffUserId, CreateIssueRequest request, CancellationToken ct = default);
        Task<PagedResult<IssueDto>> GetIssuesForManagerAsync(int? managerUserId, IssueQueryParams queryParams, CancellationToken ct = default);
        Task<IssueDto> GetIssueByIdForManagerAsync(int? managerUserId, int issueId, CancellationToken ct = default);
    }
}
