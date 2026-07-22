using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.BusinessCategory;

namespace STMM.Business.Interfaces
{
    public interface IBusinessCategoryService
    {
        Task<IEnumerable<BusinessCategoryDto>> GetAllCategoriesAsync(string? searchTerm, bool? isActive, int? currentUserId = null, CancellationToken ct = default);
        Task<BusinessCategoryDto?> GetCategoryByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default);
        Task<BusinessCategoryDto> CreateCategoryAsync(CreateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<BusinessCategoryDto> UpdateCategoryAsync(int id, UpdateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default);
        Task<bool> DeleteCategoryAsync(int id, int? currentUserId = null, CancellationToken ct = default);
    }
}
