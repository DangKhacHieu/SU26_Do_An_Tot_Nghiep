using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Content;

namespace STMM.Business.Interfaces
{
    public interface IContentService
    {
        Task<IEnumerable<ContentDto>> GetContentsAsync(string? type, string? targetRole, CancellationToken ct = default);
        Task<ContentDto> GetContentByIdAsync(int id, CancellationToken ct = default);
        Task<ContentDto> CreateContentAsync(CreateContentRequest request, CancellationToken ct = default);
        Task<ContentDto> UpdateContentAsync(int id, UpdateContentRequest request, CancellationToken ct = default);
        Task<bool> DeleteContentAsync(int id, CancellationToken ct = default);
    }
}
