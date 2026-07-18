using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.RepairPrice;

namespace STMM.Business.Interfaces
{
    public interface IRepairPriceService
    {
        Task<IEnumerable<RepairPriceDto>> GetRepairPricesAsync(CancellationToken ct = default);
        
        Task<RepairPriceDto> GetRepairPriceByIdAsync(int id, CancellationToken ct = default);
        
        Task<RepairPriceDto> CreateRepairPriceAsync(CreateRepairPriceRequest request, CancellationToken ct = default);
        
        Task<RepairPriceDto> UpdateRepairPriceAsync(int id, UpdateRepairPriceRequest request, CancellationToken ct = default);
        
        Task<bool> DeleteRepairPriceAsync(int id, CancellationToken ct = default);
        
        Task<IEnumerable<UsedRepairToolDto>> GetUsedRepairToolsAsync(CancellationToken ct = default);
    }
}
