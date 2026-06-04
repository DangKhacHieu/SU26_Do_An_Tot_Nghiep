using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Faq;

namespace STMM.Business.Interfaces
{
    public interface IFaqService
    {
        Task<IEnumerable<FaqDto>> GetFaqsAsync(string? category, bool? isActive, CancellationToken ct = default);
        Task<FaqDto> GetFaqByIdAsync(int id, CancellationToken ct = default);
        Task<FaqDto> CreateFaqAsync(CreateFaqRequest request, CancellationToken ct = default);
        Task<FaqDto> UpdateFaqAsync(int id, UpdateFaqRequest request, CancellationToken ct = default);
        Task<bool> DeleteFaqAsync(int id, CancellationToken ct = default);
    }
}
