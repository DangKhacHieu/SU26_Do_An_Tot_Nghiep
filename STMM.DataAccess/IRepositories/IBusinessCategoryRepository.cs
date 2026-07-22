using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IBusinessCategoryRepository : IBaseRepository<BusinessCategory>
    {
        Task<IEnumerable<BusinessCategory>> GetAllCategoriesAsync(string? searchTerm = null, bool? isActive = null, int? marketId = null, CancellationToken ct = default);
        Task<BusinessCategory?> GetCategoryByIdAsync(int id, CancellationToken ct = default);
    }
}
