using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using STMM.Business.Interfaces;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken ct = default)
        {
            var emailSettings = _configuration.GetSection("Email");
            
            // Parse useMock (default to true if not specified)
            bool useMock = true;
            if (emailSettings["UseDevelopmentMock"] != null)
            {
                bool.TryParse(emailSettings["UseDevelopmentMock"], out useMock);
            }

            if (useMock)
            {
                _logger.LogInformation("==================================================");
                _logger.LogInformation("MOCK EMAIL SENDER ACTIVATED (UseDevelopmentMock = true)");
                _logger.LogInformation($"To: {toEmail}");
                _logger.LogInformation($"Subject: {subject}");
                _logger.LogInformation($"Body:\n{body}");
                _logger.LogInformation("==================================================");

                Console.WriteLine("==================================================");
                Console.WriteLine("MOCK EMAIL SENDER ACTIVATED");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body:\n{body}");
                Console.WriteLine("==================================================");
                return;
            }

            try
            {
                var smtpServer = emailSettings["SmtpServer"] ?? "smtp.gmail.com";
                
                int port = 587;
                if (emailSettings["Port"] != null)
                {
                    int.TryParse(emailSettings["Port"], out port);
                }

                var senderEmail = emailSettings["SenderEmail"] ?? "";
                var senderName = emailSettings["SenderName"] ?? "Smart Market";
                var username = emailSettings["Username"] ?? "";
                var password = emailSettings["Password"] ?? "";
                
                bool enableSsl = true;
                if (emailSettings["EnableSsl"] != null)
                {
                    bool.TryParse(emailSettings["EnableSsl"], out enableSsl);
                }

                using (var client = new SmtpClient(smtpServer, port))
                {
                    client.Credentials = new NetworkCredential(username, password);
                    client.EnableSsl = enableSsl;

                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail, senderName),
                        Subject = subject,
                        Body = body,
                        IsBodyHtml = true
                    };
                    mailMessage.To.Add(toEmail);

                    await client.SendMailAsync(mailMessage);
                }

                _logger.LogInformation($"Successfully sent email to {toEmail}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Failed to send email to {toEmail} via SMTP. Falling back to Console logging.");
                
                Console.WriteLine("========================= SMTP ERROR FALLBACK =========================");
                Console.WriteLine($"To: {toEmail}");
                Console.WriteLine($"Subject: {subject}");
                Console.WriteLine($"Body:\n{body}");
                Console.WriteLine("=======================================================================");
            }
        }
    }
}
