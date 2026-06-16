using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Dashboard;

namespace STMM.Business.Interfaces
{
    public interface IDashboardService
    {
        Task<AccountantDashboardDto> GetAccountantDashboardDataAsync(CancellationToken ct = default);
    }
}
