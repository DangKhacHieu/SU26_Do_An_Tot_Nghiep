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
    public class NightlyMaintenanceWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<NightlyMaintenanceWorker> _logger;
        
        // Track the last processed day to ensure we only run once per day
        private DateTime _lastRunDate = DateTime.MinValue;

        public NightlyMaintenanceWorker(IServiceProvider serviceProvider, ILogger<NightlyMaintenanceWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("NightlyMaintenanceWorker started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var today = DateTime.Today;

                    // Only run once a day, preferably around midnight (e.g. 00:00 to 01:00)
                    // For the sake of testing/demo, we'll run it immediately if it hasn't run today.
                    if (today > _lastRunDate)
                    {
                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var systemConfigRepository = scope.ServiceProvider.GetRequiredService<ISystemConfigRepository>();
                            var billingService = scope.ServiceProvider.GetRequiredService<IBillingService>();

                            _logger.LogInformation($"[NightlyMaintenanceWorker] Starting daily maintenance routines for {today:yyyy-MM-dd}...");

                            // 1. Process Overdue Invoices (Dynamic Late Penalties)
                            int overdueProcessed = await billingService.ProcessOverdueInvoicesAsync(stoppingToken);
                            _logger.LogInformation($"[NightlyMaintenanceWorker] Processed {overdueProcessed} overdue invoices and applied daily penalties.");

                            // 2. Generate Monthly Invoices
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
                                // We check if we already generated for THIS month in the BillingService logic
                                // (AutoGenerateMonthlyInvoicesAsync internally prevents duplicates).
                                int generatedCount = await billingService.AutoGenerateMonthlyInvoicesAsync(today.Month, today.Year, null, stoppingToken);
                                if (generatedCount > 0)
                                {
                                    _logger.LogInformation($"[NightlyMaintenanceWorker] Auto monthly invoice generation completed. Generated {generatedCount} invoices for {today.Month}/{today.Year}.");
                                }
                            }

                            _lastRunDate = today;
                            _logger.LogInformation("[NightlyMaintenanceWorker] All daily maintenance routines completed successfully.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "[NightlyMaintenanceWorker] Error occurred during nightly execution.");
                }

                // Wait 12 hours before next check
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }
    }
}
