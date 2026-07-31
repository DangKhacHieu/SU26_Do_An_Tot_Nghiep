using System.Collections.Generic;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IVnpayService
    {
        Task<string> CreatePaymentUrlAsync(int invoiceId);
        Task<bool> ProcessIpnAsync(Dictionary<string, string> queryParams);
    }
}
