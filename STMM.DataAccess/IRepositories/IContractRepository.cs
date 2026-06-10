using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IContractRepository : IBaseRepository<Contract>
    {
        Task<IEnumerable<Contract>> GetContractsAsync(string? searchTerm = null, string? status = null, CancellationToken ct = default);
        Task<Contract?> GetContractByIdWithDetailsAsync(int contractId, CancellationToken ct = default);
    }
}

