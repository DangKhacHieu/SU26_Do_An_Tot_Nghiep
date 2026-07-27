using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.RepairPrice;

namespace STMM.Business.Interfaces
{
    public interface IRepairPriceService
    {
        Task<IEnumerable<RepairPriceDto>> GetRepairPricesAsync(int userId, CancellationToken ct = default);
        
        Task<RepairPriceDto> GetRepairPriceByIdAsync(int id, CancellationToken ct = default);
        
        Task<RepairPriceDto> CreateRepairPriceAsync(int userId, CreateRepairPriceRequest request, CancellationToken ct = default);
        
        Task<RepairPriceDto> UpdateRepairPriceAsync(int id, UpdateRepairPriceRequest request, CancellationToken ct = default);
        
        Task<bool> DeleteRepairPriceAsync(int id, CancellationToken ct = default);
        Task<IEnumerable<UsedRepairToolDto>> GetUsedRepairToolsAsync(int userId, CancellationToken ct = default);
    }
}
