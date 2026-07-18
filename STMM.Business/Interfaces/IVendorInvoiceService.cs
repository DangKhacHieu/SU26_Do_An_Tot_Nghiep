using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using STMM.Business.DTOs.Billing;

namespace STMM.Business.Interfaces
{
    public interface IVendorInvoiceService
    {
        Task<IEnumerable<InvoiceDto>> GetVendorInvoicesAsync(int userId, int? stallId, int? month, int? year, CancellationToken ct = default);
    }
}
