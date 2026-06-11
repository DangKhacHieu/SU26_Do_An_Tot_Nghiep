using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.BusinessCategory;

namespace STMM.Business.Interfaces
{
    public interface IBusinessCategoryService
    {
        Task<IEnumerable<BusinessCategoryDto>> GetAllCategoriesAsync(string? searchTerm, bool? isActive, CancellationToken ct);
        Task<BusinessCategoryDto?> GetCategoryByIdAsync(int id, CancellationToken ct);
        Task<BusinessCategoryDto> CreateCategoryAsync(CreateBusinessCategoryRequest request, CancellationToken ct);
        Task<BusinessCategoryDto> UpdateCategoryAsync(int id, UpdateBusinessCategoryRequest request, CancellationToken ct);
        Task<bool> DeleteCategoryAsync(int id, CancellationToken ct);
    }
}
