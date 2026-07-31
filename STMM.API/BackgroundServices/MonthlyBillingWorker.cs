using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.BackgroundServices
{
    public class MonthlyBillingWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<MonthlyBillingWorker> _logger;
        private int _lastRunMonth = -1;
        private int _lastRunYear = -1;

        public MonthlyBillingWorker(IServiceProvider serviceProvider, ILogger<MonthlyBillingWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("MonthlyBillingWorker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var today = DateTime.Today;

                    // Only run if we haven't run successfully for the current month/year
                    if (today.Month != _lastRunMonth || today.Year != _lastRunYear)
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var systemConfigRepository = scope.ServiceProvider.GetRequiredService<ISystemConfigRepository>();
                            var billingService = scope.ServiceProvider.GetRequiredService<IBillingService>();

                            // Get auto invoice day configuration
                            var config = systemConfigRepository.Query()
                                .FirstOrDefault(c => c.ConfigKey == "auto_invoice_day");

                            int targetDay = 5; // Default to 5th if not set
                            if (config != null && int.TryParse(config.ConfigValue, out var parsedDay))
                            {
                                targetDay = parsedDay;
                            }

                            if (today.Day >= targetDay)
                            {
                                _logger.LogInformation($"Today is Day {today.Day}, which meets or exceeds auto_invoice_day ({targetDay}). Starting auto generation of monthly invoices.");
                                
                                int generatedCount = await billingService.AutoGenerateMonthlyInvoicesAsync(today.Month, today.Year, null, stoppingToken);
                                
                                _logger.LogInformation($"Auto monthly invoice generation completed. Generated {generatedCount} invoices for {today.Month}/{today.Year}.");

                                _lastRunMonth = today.Month;
                                _lastRunYear = today.Year;
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in MonthlyBillingWorker execution.");
                }

                // Wait 12 hours before next check
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }
    }
}
