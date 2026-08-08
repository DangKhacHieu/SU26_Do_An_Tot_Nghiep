using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Notification;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.API.BackgroundServices
{
    public class ContractStatusWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ContractStatusWorker> _logger;
        private DateOnly? _lastRunDate = null;

        public ContractStatusWorker(IServiceProvider serviceProvider, ILogger<ContractStatusWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("ContractStatusWorker background service has started.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    var today = DateOnly.FromDateTime(DateTime.Today);

                    // Run the checks only once per calendar day
                    if (_lastRunDate == null || today != _lastRunDate.Value)
                    {
                        _logger.LogInformation($"ContractStatusWorker running daily scan for date: {today:yyyy-MM-dd}...");

                        using (var scope = _serviceProvider.CreateScope())
                        {
                            var contractRepository = scope.ServiceProvider.GetRequiredService<IContractRepository>();
                            var stallRepository = scope.ServiceProvider.GetRequiredService<IStallRepository>();
                            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

                            // 1. Process warnings (contracts expiring in exactly 7 days)
                            var warningDate = today.AddDays(7);
                            var warningContracts = await contractRepository.Query()
                                .Include(c => c.Stall)
                                .Include(c => c.Vendor)
                                .Where(c => c.Status == "Active" && c.EndDate == warningDate && c.IsDeleted != true)
                                .ToListAsync(stoppingToken);

                            foreach (var contract in warningContracts)
                            {
                                if (contract.Vendor != null)
                                {
                                    try
                                    {
                                        var stallCode = contract.Stall?.Code ?? "quầy sạp";
                                        await notificationService.CreateAsync(new CreateNotificationRequest
                                        {
                                            Title = "Hợp đồng thuê sạp sắp hết hạn",
                                            Content = $"Hợp đồng thuê sạp {stallCode} của bạn sẽ hết hạn vào ngày {contract.EndDate:dd/MM/yyyy} (còn 7 ngày). Vui lòng liên hệ Ban quản lý chợ để làm thủ tục gia hạn.",
                                            NotiType = "System",
                                            CreatedByUserId = 0, // System
                                            TargetUserId = contract.Vendor.UserId
                                        }, stoppingToken);

                                        _logger.LogInformation($"Sent 7-day expiration warning to vendor (UserId: {contract.Vendor.UserId}) for contract ID {contract.ContractId}.");
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, $"Failed to send expiration warning for contract ID {contract.ContractId}.");
                                    }
                                }
                            }

                            // 2. Process automatic expirations (contracts past their EndDate)
                            var expiredContracts = await contractRepository.Query()
                                .Include(c => c.Stall)
                                .Include(c => c.Vendor)
                                .Where(c => c.Status == "Active" && c.EndDate < today && c.IsDeleted != true)
                                .ToListAsync(stoppingToken);

                            if (expiredContracts.Any())
                            {
                                foreach (var contract in expiredContracts)
                                {
                                    try
                                    {
                                        _logger.LogInformation($"Contract ID {contract.ContractId} has expired (EndDate: {contract.EndDate:yyyy-MM-dd}). Auto-expiring...");
                                        
                                        contract.Status = "Expired";
                                        contractRepository.Update(contract);

                                        // Release the stall back to Available unless there is another active contract on it
                                        var stallId = contract.StallId;
                                        var hasOtherActive = await contractRepository.Query().AnyAsync(
                                            c => c.StallId == stallId
                                                 && c.Status == "Active"
                                                 && c.ContractId != contract.ContractId
                                                 && c.IsDeleted != true
                                                 && c.StartDate <= today,
                                            stoppingToken
                                        );

                                        if (!hasOtherActive)
                                        {
                                            var stall = await stallRepository.GetByIdAsync(stallId, stoppingToken);
                                            if (stall != null && stall.Status == "Rented")
                                            {
                                                stall.Status = "Available";
                                                stallRepository.Update(stall);
                                                _logger.LogInformation($"Stall ID {stallId} released back to Available.");
                                            }
                                        }

                                        // Send notification to vendor
                                        if (contract.Vendor != null)
                                        {
                                            var stallCode = contract.Stall?.Code ?? "quầy sạp";
                                            await notificationService.CreateAsync(new CreateNotificationRequest
                                            {
                                                Title = "Hợp đồng thuê sạp đã hết hạn",
                                                Content = $"Hợp đồng thuê sạp {stallCode} của bạn đã hết hạn vào ngày {contract.EndDate:dd/MM/yyyy} và hệ thống đã tự động chuyển trạng thái hợp đồng sang Hết hạn (Expired).",
                                                NotiType = "System",
                                                CreatedByUserId = 0, // System
                                                TargetUserId = contract.Vendor.UserId
                                            }, stoppingToken);
                                        }
                                    }
                                    catch (Exception ex)
                                    {
                                        _logger.LogError(ex, $"Failed to auto-expire contract ID {contract.ContractId}.");
                                    }
                                }

                                await contractRepository.SaveChangesAsync(stoppingToken);
                            }
                        }

                        _lastRunDate = today;
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred in ContractStatusWorker execution.");
                }

                // Check again every 12 hours
                await Task.Delay(TimeSpan.FromHours(12), stoppingToken);
            }
        }
    }
}
