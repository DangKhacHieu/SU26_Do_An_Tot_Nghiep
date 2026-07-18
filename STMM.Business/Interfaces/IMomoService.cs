using System.Threading.Tasks;
using STMM.Business.DTOs.Payment;

namespace STMM.Business.Interfaces
{
    public interface IMomoService
    {
        Task<string> CreatePaymentAsync(int invoiceId, string requestType);
        Task<bool> ProcessIpnAsync(MomoIPNRequest ipnRequest);
    }
}
