using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct = default);
    }
}
