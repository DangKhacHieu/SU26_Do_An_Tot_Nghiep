using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.DataAccess.Entities;

namespace STMM.DataAccess.IRepositories
{
    public interface IContractRepository : IBaseRepository<Contract>
    {
        Task<IEnumerable<Contract>> GetContractsAsync(string? searchTerm = null, string? status = null, int? marketId = null, CancellationToken ct = default);
        Task<Contract?> GetContractByIdWithDetailsAsync(int contractId, CancellationToken ct = default);
        Task<Contract?> GetActiveContractByStallIdAsync(int stallId, CancellationToken ct = default);
        Task<List<Stall>> GetStallsWithDebtAsync(int? accountantMarketId = null, string? search = null, CancellationToken ct = default);
        Task<Stall?> GetStallWithDebtDetailsAsync(int stallId, CancellationToken ct = default);
        Task<List<Contract>> GetAllActiveContractsWithDetailsAsync(CancellationToken ct = default);
    }
}

