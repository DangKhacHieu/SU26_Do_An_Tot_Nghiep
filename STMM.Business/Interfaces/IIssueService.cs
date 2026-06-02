using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Issue;

namespace STMM.Business.Interfaces
{
    public interface IIssueService
    {
        Task<PagedResult<IssueDto>> GetIssuesAsync(int staffUserId, IssueQueryParams queryParams, CancellationToken ct = default);
        Task<IssueDto> GetIssueByIdAsync(int issueId, int staffUserId, CancellationToken ct = default);
        Task<IssueDto> CreateIssueAsync(int staffUserId, CreateIssueRequest request, CancellationToken ct = default);
        Task<IssueDto> UpdateIssueStatusAsync(int staffUserId, int issueId, UpdateIssueStatusRequest request, CancellationToken ct = default);
    }
}
