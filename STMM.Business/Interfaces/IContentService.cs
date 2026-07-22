using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Content;

namespace STMM.Business.Interfaces
{
    public interface IContentService
    {
        Task<IEnumerable<ContentDto>> GetContentsAsync(string? type, string? targetRole, int? currentUserId = null, CancellationToken ct = default);
        Task<ContentDto> GetContentByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default);
        Task<ContentDto> CreateContentAsync(CreateContentRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<ContentDto> UpdateContentAsync(int id, UpdateContentRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<bool> DeleteContentAsync(int id, int? currentUserId = null, CancellationToken ct = default);
    }
}
