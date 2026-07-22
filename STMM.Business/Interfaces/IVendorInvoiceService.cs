using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Common;

namespace STMM.Business.Interfaces
{
    public interface IVendorInvoiceService
    {
        Task<PagedResult<InvoiceDto>> GetVendorInvoicesAsync(int userId, int? stallId, int? month, int? year, int pageNumber, int pageSize, CancellationToken ct = default);
    }
}
