using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IAreaRepository : IBaseRepository<Area>
    {
        Task<IEnumerable<Area>> GetAllAreasAsync(int? marketId = null, CancellationToken ct = default);
        Task<Area?> GetAreaByIdAsync(int id, CancellationToken ct = default);
    }
}
