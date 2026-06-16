using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IFaqRepository : IBaseRepository<Faq>
    {
        Task<IEnumerable<Faq>> GetFaqsAsync(string? category, bool? isActive, CancellationToken ct = default);
    }
}
