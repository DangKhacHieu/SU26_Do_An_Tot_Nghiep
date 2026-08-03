using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Dashboard;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class BillingService : IBillingService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IMeterRepository _meterRepository;
        private readonly IMeterReadingRepository _meterReadingRepository;
        private readonly IFeeTypeRepository _feeTypeRepository;
        private readonly IViolationRepository _violationRepository;
        private readonly IRequestRepository _requestRepository;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IEmailService _emailService;
        private readonly IUserRepository _userRepository;
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly IServiceRegistrationRepository _serviceRegistrationRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly ILogger<BillingService> _logger;
        private readonly FluentValidation.IValidator<ReceiveCashPaymentRequest> _paymentValidator;
        private readonly FluentValidation.IValidator<MeterReadingAdjustmentRequest> _meterAdjustmentValidator;
        private readonly FluentValidation.IValidator<CreateAdHocInvoiceRequest> _createAdHocInvoiceValidator;

        public BillingService(
            IInvoiceRepository invoiceRepository,
            IPaymentRepository paymentRepository,
            IContractRepository contractRepository,
            IMeterRepository meterRepository,
            IMeterReadingRepository meterReadingRepository,
            IFeeTypeRepository feeTypeRepository,
            IViolationRepository violationRepository,
            IRequestRepository requestRepository,
            IMapper mapper,
            INotificationService notificationService,
            IEmailService emailService,
            IUserRepository userRepository,
            ISystemConfigRepository systemConfigRepository,
            IServiceRegistrationRepository serviceRegistrationRepository,
            IStallRepository stallRepository,
            IAuditLogRepository auditLogRepository,
            ILogger<BillingService> logger,
            FluentValidation.IValidator<ReceiveCashPaymentRequest> paymentValidator,
            FluentValidation.IValidator<MeterReadingAdjustmentRequest> meterAdjustmentValidator,
            FluentValidation.IValidator<CreateAdHocInvoiceRequest> createAdHocInvoiceValidator)
        {
            _invoiceRepository = invoiceRepository;
            _paymentRepository = paymentRepository;
            _contractRepository = contractRepository;
            _meterRepository = meterRepository;
            _meterReadingRepository = meterReadingRepository;
            _feeTypeRepository = feeTypeRepository;
            _violationRepository = violationRepository;
            _requestRepository = requestRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _emailService = emailService;
            _userRepository = userRepository;
            _systemConfigRepository = systemConfigRepository;
            _serviceRegistrationRepository = serviceRegistrationRepository;
            _stallRepository = stallRepository;
            _auditLogRepository = auditLogRepository;
            _logger = logger;
            _paymentValidator = paymentValidator;
            _meterAdjustmentValidator = meterAdjustmentValidator;
            _createAdHocInvoiceValidator = createAdHocInvoiceValidator;
        }

        public async Task<InvoiceDto> GetInvoiceDetailAsync(
            int invoiceId,
            CancellationToken ct = default)
        {
            var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoiceId, ct);
            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {invoiceId} not found.");
            }

            return MapInvoiceToDto(invoice);
        }

        public async Task<InvoiceDto> GetInvoiceDetailForAccountantAsync(
            int invoiceId,
            int accountantUserId,
            CancellationToken ct = default)
        {
            var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoiceId, ct);
            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {invoiceId} not found.");
            }

            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                if (invoice.Contract?.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền xem chi tiết hóa đơn của chợ khác.");
                }
            }

            return MapInvoiceToDto(invoice);
        }

        /// <inheritdoc />
        public async Task<InvoiceDto> GetInvoiceDetailAsync(int staffUserId, int invoiceId, CancellationToken ct = default)
        {
            var marketId = await GetUserMarketIdAsync(staffUserId, ct);
            var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoiceId, marketId, ct);

            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {invoiceId} not found.");
            }

            return MapInvoiceToDto(invoice);
        }

        /// <inheritdoc />
        public async Task<PaymentResultDto> ReceiveCashPaymentAsync(
            int staffUserId, ReceiveCashPaymentRequest request, CancellationToken ct = default)
        {
            var validationResult = await _paymentValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var marketId = await GetUserMarketIdAsync(staffUserId, ct);
            Invoice invoice;
            Payment payment;

            await using (var transaction = await _invoiceRepository.BeginTransactionAsync(ct))
            {
                try
                {
                    if (!await _invoiceRepository.LockInvoiceForPaymentAsync(request.InvoiceId, marketId, ct))
                        throw new NotFoundException($"Invoice with ID {request.InvoiceId} not found.");

                    invoice = await _invoiceRepository.GetInvoiceWithRelationsForPaymentAsync(request.InvoiceId, marketId, ct)
                        ?? throw new NotFoundException($"Invoice with ID {request.InvoiceId} not found.");

                    if (invoice.Status != "Unpaid")
                    {
                        throw new BadRequestException(
                            $"Invoice is in status '{invoice.Status}'. Payment can only be collected for 'Unpaid' invoices.");
                    }

                    payment = new Payment
                    {
                        InvoiceId = invoice.InvoiceId,
                        Amount = invoice.TotalAmount,
                        Method = "Cash",
                        TransactionCode = $"CASH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                        PaidAt = DateTime.UtcNow,
                        Status = "Pending"
                    };

                    await _paymentRepository.AddAsync(payment, ct);
                    invoice.Status = "Pending Confirmation";
                    await _invoiceRepository.SaveChangesAsync(ct);
                    await transaction.CommitAsync(ct);
                }
                catch (DbUpdateConcurrencyException)
                {
                    await transaction.RollbackAsync(ct);
                    throw new ConflictException("Hóa đơn này đã được cập nhật bởi một người khác. Vui lòng tải lại trang.");
                }
                catch
                {
                    await transaction.RollbackAsync(ct);
                    throw;
                }
            }

            var vendor = invoice.Contract.Vendor;
            var stall = invoice.Contract.Stall;

            // Notifying outside the transaction on purpose: a slow or failing notification must not
            // hold the invoice row lock, nor roll back a payment that was already committed.
            try
            {
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = "Cash Payment Recorded",
                    Content = $"Staff recorded cash payment for invoice of month {invoice.Month}/{invoice.Year} " +
                              $"at stall {stall.Code} for amount {invoice.TotalAmount:#,##0} VND. " +
                              $"Please wait for accountant confirmation.",
                    NotiType = "Invoice",
                    CreatedByUserId = staffUserId,
                    TargetUserId = vendor.UserId
                }, ct);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unable to notify vendor {VendorUserId} about cash payment for invoice {InvoiceId}.",
                    vendor.UserId,
                    invoice.InvoiceId);
            }

            return new PaymentResultDto
            {
                PaymentId = payment.PaymentId,
                InvoiceId = invoice.InvoiceId,
                Amount = payment.Amount,
                Method = payment.Method,
                TransactionCode = payment.TransactionCode,
                PaidAt = payment.PaidAt,
                NewInvoiceStatus = invoice.Status
            };
        }

        /// <inheritdoc />
        public async Task<List<UnpaidInvoiceSummaryDto>> GetUnpaidInvoicesByStallAsync(
            int staffUserId,
            int stallId,
            CancellationToken ct = default)
        {
            var marketId = await GetUserMarketIdAsync(staffUserId, ct);
            var invoices = await _invoiceRepository.GetUnpaidInvoicesByStallAsync(stallId, marketId, ct);
            if (invoices.Count == 0)
            {
                var stall = await _stallRepository.GetStallForMarketAsync(stallId, marketId, ct);
                if (stall == null)
                {
                    throw new NotFoundException($"Stall with ID {stallId} not found.");
                }
            }

            return invoices.Select(i => new UnpaidInvoiceSummaryDto
            {
                InvoiceId = i.InvoiceId,
                Month = i.Month,
                Year = i.Year,
                TotalAmount = i.TotalAmount,
                DueDate = i.DueDate,
                FeeTypeSummary = string.Join(", ", i.InvoiceDetails
                    .Select(d => d.FeeType?.Name)
                    .Where(name => !string.IsNullOrEmpty(name))
                    .Distinct())
            }).ToList();
        }

        private async Task<int> GetUserMarketIdAsync(int userId, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException("The staff account is not assigned to a market.");
            }

            return user.MarketId.Value;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(int? month, int? year, string? status, string? search, int? accountantUserId = null, CancellationToken ct = default)
        {
            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                marketId = user?.MarketId;
            }

            var invoices = await _invoiceRepository.GetInvoicesWithDetailsAsync(month, year, status, search, marketId, ct);
            return invoices.Select(MapInvoiceToDto);
        }

        /// <inheritdoc />
        public async Task<bool> BulkApproveInvoicesAsync(BulkApproveInvoicesRequest request, int accountantUserId, CancellationToken ct = default)
        {
            if (request == null || !request.InvoiceIds.Any()) return false;

            int? marketId = null;
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null)
            {
                marketId = accountantUser.MarketId;
            }

            var dueDaysConfig = await _systemConfigRepository.GetSystemConfigByKeyAsync("invoice_due_days", marketId, ct);
            int dueDays = 15;
            if (dueDaysConfig != null && int.TryParse(dueDaysConfig.ConfigValue, out int configDays))
            {
                dueDays = configDays;
            }

            var requestedIds = request.InvoiceIds.Distinct().ToList();
            var invoices = await _invoiceRepository.GetDraftInvoicesByIdsAsync(requestedIds, marketId, ct);

            if (invoices.Count != requestedIds.Count)
                throw new BadRequestException("Only draft invoices in the accountant's market can be issued.");

            foreach (var invoice in invoices)
            {
                invoice.Status = "Unpaid";
                if (!invoice.DueDate.HasValue)
                {
                    invoice.DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(dueDays));
                }

                // Send notification to Vendor
                if (invoice.Contract?.Vendor != null)
                {
                    await _notificationService.CreateAsync(new CreateNotificationRequest
                    {
                        CreatedByUserId = accountantUserId,
                        TargetUserId = invoice.Contract.Vendor.UserId,
                        Title = "Thông báo: Hóa đơn mới đã được phát hành",
                        Content = $"Hóa đơn kỳ {invoice.Month}/{invoice.Year} cho sạp {invoice.Contract.Stall?.Code} đã được ban quản lý phát hành với tổng số tiền là {invoice.TotalAmount:#,##0} VNĐ. Vui lòng thanh toán trước ngày {invoice.DueDate?.ToString("dd/MM/yyyy")}.",
                        NotiType = "Invoice"
                    }, ct);
                }
            }

            await _invoiceRepository.SaveChangesAsync(ct);
            return true;
        }

        /// <inheritdoc />
        public async Task<InvoiceDto> CreateAdHocInvoiceAsync(CreateAdHocInvoiceRequest request, int accountantUserId, CancellationToken ct = default)
        {
            var valResult = await _createAdHocInvoiceValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                var errors = string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var feeType = await _feeTypeRepository.GetByIdAsync(request.FeeTypeId, ct);
            if (feeType == null)
            {
                throw new NotFoundException($"Không tìm thấy loại phí ID {request.FeeTypeId}.");
            }

            var contract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);

            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng hoạt động cho gian hàng ID {request.StallId}.");
            }

            // Cross-tenant check: Accountant can only create invoice for stalls in their market
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                if (contract.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền tạo hóa đơn cho sạp thuộc khu vực/chợ khác.");
                }
            }

            using var transaction = await _invoiceRepository.BeginTransactionAsync(ct);
            try
            {
                var invoice = new Invoice
                {
                    ContractId = contract.ContractId,
                    Month = request.Month,
                    Year = request.Year,
                    TotalAmount = request.Amount,
                    Status = "Unpaid",
                    InvoiceType = "AdHoc",
                    DueDate = request.DueDate,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _invoiceRepository.AddAsync(invoice, ct);
                await _invoiceRepository.SaveChangesAsync(ct);

                var detail = new InvoiceDetail
                {
                    InvoiceId = invoice.InvoiceId,
                    FeeTypeId = request.FeeTypeId,
                    Description = request.Description,
                    Quantity = 1,
                    UnitPrice = request.Amount,
                    Amount = request.Amount
                };
                invoice.InvoiceDetails.Add(detail);

                // Add AuditLog
                var auditLog = new AuditLog
                {
                    UserId = accountantUserId,
                    Action = $"CreateAdHocInvoice_M{request.Month}_Y{request.Year}_Amount{request.Amount}_Stall{contract.Stall?.Code}",
                    CreatedAt = DateTime.UtcNow
                };
                await _auditLogRepository.AddAsync(auditLog, ct);

                await _invoiceRepository.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                var freshInvoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoice.InvoiceId, ct);

                if (freshInvoice?.Contract?.Vendor != null)
                {
                    await _notificationService.CreateAsync(new CreateNotificationRequest
                    {
                        CreatedByUserId = accountantUserId,
                        TargetUserId = freshInvoice.Contract.Vendor.UserId,
                        Title = "Thông báo: Hóa đơn mới đã được phát hành",
                        Content = $"Hóa đơn kỳ {freshInvoice.Month}/{freshInvoice.Year} cho sạp {freshInvoice.Contract.Stall?.Code} đã được ban quản lý phát hành với tổng số tiền là {freshInvoice.TotalAmount:#,##0} VNĐ. Vui lòng thanh toán trước ngày {freshInvoice.DueDate?.ToString("dd/MM/yyyy")}.",
                        NotiType = "Invoice"
                    }, ct);
                }

                return MapInvoiceToDto(freshInvoice!);
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<bool> AdjustMeterReadingAsync(int creatorUserId, MeterReadingAdjustmentRequest request, CancellationToken ct = default)
        {
            var valResult = await _meterAdjustmentValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                var errors = string.Join(" ", valResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            // Cross-tenant check
            var accountantUser = await _userRepository.GetByIdAsync(creatorUserId, ct);
            int? accountantMarketId = accountantUser?.MarketId;
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                var stallContract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);
                if (stallContract != null && stallContract.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền chỉnh sửa chỉ số điện/nước của sạp thuộc chợ khác.");
                }
            }

            // 1. Get active Meter for StallId & Type
            var meter = await _meterRepository.GetActiveMeterByStallAndTypeAsync(request.StallId, request.MeterType, ct);

            if (meter == null)
            {
                throw new BadRequestException($"Đồng hồ {request.MeterType} chưa được cài đặt cho sạp này. Yêu cầu tạo đồng hồ trước.");
            }

            // 2. Find or Create MeterReading for this period
            var reading = await _meterReadingRepository.GetMeterReadingByMonthAndYearAsync(meter.MeterId, request.Month, request.Year, ct);

            if (reading == null)
            {
                reading = new MeterReading
                {
                    MeterId = meter.MeterId,
                    OldValue = request.OldValue,
                    NewValue = request.NewValue,
                    RecordedAt = DateOnly.FromDateTime(DateTime.Today),
                    CreatedByUserId = creatorUserId,
                    ImageUrl = request.ImageUrl,
                    IsSynced = true
                };
                await _meterReadingRepository.AddAsync(reading, ct);
            }
            else
            {
                reading.OldValue = request.OldValue;
                reading.NewValue = request.NewValue;
                reading.ImageUrl = request.ImageUrl;
                reading.CreatedByUserId = creatorUserId;
            }

            await _meterReadingRepository.SaveChangesAsync(ct);

            // Log the reason
            var auditLog = new AuditLog
            {
                UserId = creatorUserId,
                Action = $"AdjustMeterReading_Stall{request.StallId}_{request.MeterType}_M{request.Month}Y{request.Year}. Lý do: {request.Reason}. Từ {request.OldValue} -> {request.NewValue}",
                CreatedAt = DateTime.UtcNow
            };
            await _auditLogRepository.AddAsync(auditLog, ct);
            await _auditLogRepository.SaveChangesAsync(ct);

            // 3. Find corresponding Invoice of the stall in this month/year to update
            var contract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);

            if (contract != null)
            {
                // We get the non-canceled invoice for this contract, month, year
                var existingInvoice = await _invoiceRepository.Query()
                    .Include(i => i.InvoiceDetails)
                    .Where(i => i.ContractId == contract.ContractId && i.Month == request.Month && i.Year == request.Year && i.IsDeleted != true && i.Status != "Canceled" && i.InvoiceType != "Adjustment")
                    .FirstOrDefaultAsync(ct);

                if (existingInvoice != null)
                {
                    double consumption = request.NewValue - request.OldValue;
                    if (consumption < 0) consumption = 0;

                    var feeTypeName = request.MeterType == "Electricity" ? "Điện" : "Nước";
                    var feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync(feeTypeName, null, ct);
                    int feeTypeId = feeType?.FeeTypeId ?? (request.MeterType == "Electricity" ? 2 : 3);

                    // Fetch Tier pricing from SystemConfig
                    string configKey = request.MeterType == "Electricity" ? "electricity_tiers" : "water_tiers";
                    var config = await _systemConfigRepository.GetSystemConfigByKeyAsync(configKey, accountantMarketId, ct);
                    List<UtilityTierStep>? tiers = null;
                    if (config != null && !string.IsNullOrEmpty(config.ConfigValue))
                    {
                        try
                        {
                            tiers = System.Text.Json.JsonSerializer.Deserialize<List<UtilityTierStep>>(config.ConfigValue);
                        }
                        catch { }
                    }

                    if (tiers == null || !tiers.Any())
                    {
                        // Fallback defaults
                        tiers = new List<UtilityTierStep>
                        {
                            new UtilityTierStep { Step = 1, From = 0, To = null, Price = request.MeterType == "Electricity" ? 3500 : 18000 }
                        };
                    }

                    decimal totalAmountForUtility = UtilityPricingCalculator.CalculatePrice(consumption, tiers);

                    if (existingInvoice.Status == "Draft")
                    {
                        // It is safe to overwrite a Draft invoice
                        var detail = existingInvoice.InvoiceDetails.FirstOrDefault(d => d.FeeTypeId == feeTypeId);
                        if (detail == null)
                        {
                            detail = new InvoiceDetail
                            {
                                InvoiceId = existingInvoice.InvoiceId,
                                FeeTypeId = feeTypeId,
                                Description = $"Tiêu thụ {request.MeterType.ToLower()} {request.Month}/{request.Year} ({request.OldValue} -> {request.NewValue})",
                                Quantity = consumption,
                                UnitPrice = totalAmountForUtility > 0 && consumption > 0 ? totalAmountForUtility / (decimal)consumption : 0,
                                Amount = totalAmountForUtility
                            };
                            existingInvoice.InvoiceDetails.Add(detail);
                        }
                        else
                        {
                            detail.Quantity = consumption;
                            detail.Description = $"Tiêu thụ {request.MeterType.ToLower()} {request.Month}/{request.Year} ({request.OldValue} -> {request.NewValue})";
                            detail.UnitPrice = totalAmountForUtility > 0 && consumption > 0 ? totalAmountForUtility / (decimal)consumption : 0;
                            detail.Amount = totalAmountForUtility;
                        }

                        existingInvoice.TotalAmount = existingInvoice.InvoiceDetails.Sum(d => d.Amount);
                        await _invoiceRepository.SaveChangesAsync(ct);
                    }
                    else
                    {
                        // Invoice is Unpaid, Pending Confirmation or Paid.
                        // We must create an Adjustment invoice and cancel/adjust the old one.
                        existingInvoice.Status = "Adjusted"; // Mark old invoice as adjusted

                        var newInvoice = new Invoice
                        {
                            ContractId = contract.ContractId,
                            Month = request.Month,
                            Year = request.Year,
                            Status = "Unpaid",
                            InvoiceType = "Adjustment",
                            DueDate = existingInvoice.DueDate,
                            AdjustedFromId = existingInvoice.InvoiceId,
                            CreatedAt = DateTime.UtcNow,
                            IsDeleted = false
                        };

                        await _invoiceRepository.AddAsync(newInvoice, ct);
                        await _invoiceRepository.SaveChangesAsync(ct);

                        // Copy other details, and replace the modified one
                        foreach (var oldDetail in existingInvoice.InvoiceDetails)
                        {
                            if (oldDetail.FeeTypeId == feeTypeId)
                            {
                                newInvoice.InvoiceDetails.Add(new InvoiceDetail
                                {
                                    InvoiceId = newInvoice.InvoiceId,
                                    FeeTypeId = feeTypeId,
                                    Description = $"Điều chỉnh {request.MeterType.ToLower()} {request.Month}/{request.Year} ({request.OldValue} -> {request.NewValue})",
                                    Quantity = consumption,
                                    UnitPrice = totalAmountForUtility > 0 && consumption > 0 ? totalAmountForUtility / (decimal)consumption : 0,
                                    Amount = totalAmountForUtility
                                });
                            }
                            else
                            {
                                newInvoice.InvoiceDetails.Add(new InvoiceDetail
                                {
                                    InvoiceId = newInvoice.InvoiceId,
                                    FeeTypeId = oldDetail.FeeTypeId,
                                    Description = oldDetail.Description,
                                    Quantity = oldDetail.Quantity,
                                    UnitPrice = oldDetail.UnitPrice,
                                    Amount = oldDetail.Amount
                                });
                            }
                        }

                        newInvoice.TotalAmount = newInvoice.InvoiceDetails.Sum(d => d.Amount);
                        await _invoiceRepository.SaveChangesAsync(ct);
                    }
                }
            }

            return true;
        }

        private static InvoiceDto MapInvoiceToDto(Invoice invoice)
        {
            var stall = invoice.Contract?.Stall;
            var vendor = invoice.Contract?.Vendor;
            var vendorUser = vendor?.User;

            // Rule: Tab 1 (Periodic) vs Tab 2 (Irregular).
            // Invoices with any of the following manual fee types are considered Irregular (Tab 2).
            var irregularKeywords = new[] { "phạt", "vi phạm", "sửa chữa", "bồi thường", "truy thu" };
            var isIrregular = invoice.InvoiceDetails.Any(d => d.FeeType != null && 
                irregularKeywords.Any(k => d.FeeType.Name.Contains(k, StringComparison.OrdinalIgnoreCase)));

            return new InvoiceDto
            {
                InvoiceId = invoice.InvoiceId,
                ContractId = invoice.ContractId,
                Month = invoice.Month,
                Year = invoice.Year,
                TotalAmount = invoice.TotalAmount,
                Status = invoice.Status ?? string.Empty,
                DueDate = invoice.DueDate,
                CreatedAt = invoice.CreatedAt,
                StallId = stall?.StallId ?? 0,
                StallCode = stall?.Code ?? string.Empty,
                StallCategory = stall?.Category?.Name ?? string.Empty,
                VendorName = vendor?.BusinessName ?? vendorUser?.Name ?? string.Empty,
                VendorPhone = vendorUser?.Phone ?? string.Empty,
                InvoiceType = isIrregular ? "Irregular" : "Periodic",
                Details = invoice.InvoiceDetails.Select(d => new InvoiceDetailDto
                {
                    InvoiceDetailId = d.InvoiceDetailId,
                    FeeTypeId = d.FeeTypeId,
                    FeeTypeName = d.FeeType?.Name ?? string.Empty,
                    Description = d.Description,
                    Quantity = d.Quantity,
                    UnitPrice = d.UnitPrice,
                    Amount = d.Amount
                }),
                Payments = invoice.Payments.Select(p => new PaymentSummaryDto
                {
                    PaymentId = p.PaymentId,
                    Amount = p.Amount,
                    Method = p.Method,
                    PaidAt = p.PaidAt
                })
            };
        }

        /// <inheritdoc />
        public async Task<IEnumerable<PaymentVerificationDto>> GetPendingPaymentsAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                marketId = user?.MarketId;
            }

            var payments = await _paymentRepository.GetPendingPaymentsWithDetailsAsync(marketId, ct);

            return payments.Select(p => new PaymentVerificationDto
            {
                PaymentId = p.PaymentId,
                TransactionCode = p.TransactionCode ?? $"TX-{p.PaymentId:D3}",
                Method = p.Method == "Cash" ? "Tiền mặt" : "Chuyển khoản NH",
                Amount = p.Amount,
                PaidAt = p.PaidAt,
                InvoiceId = p.InvoiceId,
                StallCode = p.Invoice?.Contract?.Stall?.Code ?? "N/A",
                TenantName = p.Invoice?.Contract?.Vendor?.User?.Name ?? "N/A",
                Status = p.Invoice?.Status == "Paid" ? "Approved" : "Pending"
            });
        }

        /// <inheritdoc />
        public async Task<bool> VerifyPaymentAsync(int paymentId, VerifyPaymentRequest request, int accountantUserId, CancellationToken ct = default)
        {
            var payment = await _paymentRepository.GetPaymentWithInvoiceAndVendorAsync(paymentId, ct);

            if (payment == null)
            {
                throw new NotFoundException($"Không tìm thấy giao dịch ID {paymentId}");
            }

            var invoice = payment.Invoice;
            if (invoice == null)
            {
                throw new NotFoundException($"Không tìm thấy hóa đơn liên kết với giao dịch ID {paymentId}");
            }

            var vendor = invoice.Contract?.Vendor;
            var targetUserId = vendor?.UserId ?? 0;

            if (payment.Status != "Pending" || invoice.Status != "Pending Confirmation")
            {
                throw new BadRequestException("Payment is no longer pending verification.");
            }

            // Check if the accountant belongs to the same market as the invoice
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                if (invoice.Contract?.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền duyệt thanh toán cho giao dịch của chợ khác.");
                }
            }

            using var transaction = await _invoiceRepository.BeginTransactionAsync(ct);
            try
            {
                if (request.Approve)
                {
                    // Approve payment: set invoice status to Paid
                    invoice.Status = "Paid";
                    _invoiceRepository.Update(invoice);

                    // If it is a violation invoice, update the violation status to Paid
                    if (invoice.InvoiceType == "Violation" && invoice.ViolationId.HasValue)
                    {
                        var violation = await _violationRepository.GetByIdAsync(invoice.ViolationId.Value, ct);
                        if (violation != null)
                        {
                            violation.Status = "Paid";
                            violation.UpdatedAt = DateTime.UtcNow;
                            // _violationRepository.Update is not strictly needed if tracking, but let's be safe
                        }
                    }
                    
                    payment.Status = "Verified";
                    payment.VerifiedAt = DateTime.UtcNow;
                    payment.VerifiedByUserId = accountantUserId;
                    _paymentRepository.Update(payment);

                    // Send approved notification
                    if (targetUserId > 0)
                     {
                        await _notificationService.CreateAsync(new CreateNotificationRequest
                        {
                            Title = "Xác nhận thanh toán thành công",
                            Content = $"Giao dịch nộp tiền phí {payment.Amount:#,##0} VNĐ cho hóa đơn tháng {invoice.Month}/{invoice.Year} của sạp {invoice.Contract?.Stall?.Code} đã được Kế toán xác nhận thành công.",
                            NotiType = "Invoice",
                            CreatedByUserId = accountantUserId,
                            TargetUserId = targetUserId
                        }, ct);
                    }
                }
                else
                {
                    // Reject payment: set invoice status back to Unpaid and keep the payment record
                    invoice.Status = "Unpaid";
                    _invoiceRepository.Update(invoice);
                    
                    payment.Status = "Rejected";
                    payment.RejectionReason = request.RejectionNote?.Trim();
                    payment.VerifiedAt = DateTime.UtcNow;
                    payment.VerifiedByUserId = accountantUserId;
                    _paymentRepository.Update(payment);

                    // Send rejection notification
                    if (targetUserId > 0)
                    {
                        await _notificationService.CreateAsync(new CreateNotificationRequest
                        {
                            Title = "Từ chối xác nhận thanh toán",
                            Content = $"Giao dịch nộp tiền với mã {payment.TransactionCode} trị giá {payment.Amount:#,##0} VNĐ đã bị từ chối. Lý do: {request.RejectionNote ?? "Thông tin thanh toán không khớp"}.",
                            NotiType = "Invoice",
                            CreatedByUserId = accountantUserId,
                            TargetUserId = targetUserId
                        }, ct);
                    }
                }

                await _invoiceRepository.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync(ct);
                throw new ConflictException("Dữ liệu này đã được cập nhật bởi một người khác. Vui lòng tải lại trang.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<IEnumerable<STMM.Business.DTOs.Vendor.AccountantVendorDto>> GetVendorsForAccountantAsync(int accountantUserId, CancellationToken ct = default)
        {
            int? marketId = null;
            var user = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (user != null) marketId = user.MarketId;

            var vendors = await _userRepository.Query()
                .Include(u => u.Vendor)
                    .ThenInclude(v => v!.ServiceRegistrations)
                        .ThenInclude(sr => sr.Service)
                .Include(u => u.Vendor)
                    .ThenInclude(v => v!.Contracts)
                        .ThenInclude(c => c.Stall)
                .Where(u => u.Role.Name == "Vendor" && u.MarketId == marketId && u.IsDeleted == false)
                .ToListAsync(ct);

            var result = vendors.Where(u => u.Vendor != null).Select(u => new STMM.Business.DTOs.Vendor.AccountantVendorDto
            {
                VendorId = u.Vendor!.VendorId,
                BusinessName = u.Vendor.BusinessName,
                OwnerName = u.Name,
                Phone = u.Phone,
                Email = u.Email,
                TaxCode = u.Vendor.TaxCode,
                BankAccount = u.Vendor.BankAccount,
                BankName = u.Vendor.BankName,
                Status = u.Status,
                RegisteredServices = u.Vendor.ServiceRegistrations
                    .Where(sr => sr.Status == "Active")
                    .Select(sr => sr.Service?.Name ?? "Dịch vụ")
                    .Distinct()
                    .ToList(),
                StallCodes = u.Vendor.Contracts
                    .Where(c => c.Status == "Active" && c.Stall != null)
                    .Select(c => c.Stall!.Code)
                    .Distinct()
                    .ToList()
            }).ToList();

            return result;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<DebtOfStallDto>> GetStallsDebtListAsync(string? search, int? accountantUserId = null, CancellationToken ct = default)
        {
            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                marketId = user?.MarketId;
            }

            var stalls = await _contractRepository.GetStallsWithDebtAsync(marketId, search, ct);

            var list = new List<DebtOfStallDto>();
            foreach (var s in stalls)
            {
                var activeContract = s.Contracts.FirstOrDefault(c => c.Status == "Active" && c.IsDeleted != true);
                var vendor = activeContract?.Vendor;
                
                var today = DateOnly.FromDateTime(DateTime.UtcNow);
                var unpaidInvoices = s.Contracts.SelectMany(c => c.Invoices)
                    .Where(i => i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation") && i.DueDate.HasValue && i.DueDate.Value < today)
                    .ToList();

                decimal rentDebt = 0;
                decimal utilityDebt = 0;
                decimal violationDebt = 0;
                DateOnly? lastDueDate = null;

                foreach (var inv in unpaidInvoices)
                 {
                    if (inv.DueDate.HasValue)
                    {
                        if (lastDueDate == null || inv.DueDate.Value > lastDueDate.Value)
                        {
                            lastDueDate = inv.DueDate;
                        }
                    }

                    foreach (var det in inv.InvoiceDetails)
                    {
                        var feeName = det.FeeType?.Name?.ToLower() ?? "";
                        if (feeName.Contains("thuê") || feeName.Contains("rent") || feeName.Contains("sạp"))
                        {
                            rentDebt += det.Amount;
                        }
                        else if (feeName.Contains("phạt") || feeName.Contains("vi phạm") || inv.InvoiceType == "Violation")
                        {
                            violationDebt += det.Amount;
                        }
                        else
                        {
                            utilityDebt += det.Amount;
                        }
                    }
                }

                var totalDebt = rentDebt + utilityDebt + violationDebt;

                if (totalDebt > 0)
                {
                    list.Add(new DebtOfStallDto
                    {
                        StallId = s.StallId,
                        StallCode = s.Code,
                        TenantName = vendor?.User?.Name ?? "Chưa có chủ",
                        RentDebt = rentDebt,
                        UtilityDebt = utilityDebt,
                        ViolationDebt = violationDebt,
                        TotalDebt = totalDebt,
                        LastDueDate = lastDueDate
                    });
                }
            }

            return list;
        }

        /// <inheritdoc />
        public async Task<StallDebtDetailDto> GetStallDebtDetailsAsync(int stallId, int accountantUserId, CancellationToken ct = default)
        {
            var stall = await _contractRepository.GetStallWithDebtDetailsAsync(stallId, ct);

            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp ID {stallId}");
            }

            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                if (stall.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền xem chi tiết công nợ của sạp thuộc chợ khác.");
                }
            }

            var activeContract = stall.Contracts.FirstOrDefault(c => c.Status == "Active" && c.IsDeleted != true);
            var vendor = activeContract?.Vendor;

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            var unpaidInvoices = stall.Contracts.SelectMany(c => c.Invoices)
                .Where(i => i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation") && i.DueDate.HasValue && i.DueDate.Value < today)
                .OrderByDescending(i => i.Year)
                .ThenByDescending(i => i.Month)
                .Select(i => new UnpaidInvoiceDetailDto
                {
                    InvoiceId = i.InvoiceId,
                    Month = i.Month,
                    Year = i.Year,
                    TotalAmount = i.TotalAmount,
                    Status = i.Status ?? "Unpaid",
                    DueDate = i.DueDate,
                    CreatedAt = i.CreatedAt
                })
                .ToList();

              var unpaidViolations = new List<UnpaidViolationDetailDto>();

            return new StallDebtDetailDto
            {
                StallId = stall.StallId,
                StallCode = stall.Code,
                TenantName = vendor?.User?.Name ?? "Chưa có chủ",
                UnpaidInvoices = unpaidInvoices,
                UnpaidViolations = unpaidViolations
            };
        }

        /// <inheritdoc />
        public async Task<bool> SendDebtReminderAsync(SendDebtNotificationRequest request, int senderUserId, CancellationToken ct = default)
        {
            var activeContract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);
            var stall = activeContract != null ? new { Code = activeContract.Stall.Code, UserId = activeContract.Vendor.UserId, Email = activeContract.Vendor.User.Email, Name = activeContract.Vendor.User.Name } : null;

            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp hoạt động ID {request.StallId} để gửi nhắc nợ.");
            }

            var unpaidInvoicesSum = await _invoiceRepository.GetTotalUnpaidAmountByStallIdAsync(request.StallId, ct);

            var violations = await _violationRepository.GetUnpaidViolationsByStallIdAsync(request.StallId, ct);
            var unpaidViolationsSum = violations.Sum(v => v.FineAmount ?? v.ViolationType?.DefaultFine ?? 0);

            var totalDebt = unpaidInvoicesSum + unpaidViolationsSum;

            var message = request.CustomMessage;
            if (string.IsNullOrWhiteSpace(message))
            {
                message = $"Ban quản lý thông báo: Sạp {stall.Code} hiện đang có tổng nợ phí chưa thanh toán là {totalDebt:#,##0} VNĐ. Kính đề nghị Quý khách thanh toán sớm nhất để tránh bị gián đoạn dịch vụ.";
            }

            // 1. Send in-app notification
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = $"Nhắc nhở nợ phí sạp {stall.Code}",
                Content = message,
                NotiType = "Invoice",
                CreatedByUserId = senderUserId,
                TargetUserId = stall.UserId
            }, ct);

            // 2. Send email notification if vendor has an email
            if (!string.IsNullOrWhiteSpace(stall.Email))
            {
                var emailBody = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"">
    <div style=""text-align: center; margin-bottom: 20px;"">
        <h2 style=""color: #d32f2f; margin: 0;"">Smart Market (STMM)</h2>
        <p style=""color: #666; font-size: 14px; margin: 5px 0 0 0;"">Hệ thống quản lý chợ thông minh</p>
    </div>
    <div style=""background-color: #fff9c4; padding: 20px; border-radius: 6px; border-left: 4px solid #fbc02d; margin-bottom: 20px;"">
        <p style=""margin-top: 0; font-size: 16px;"">Kính gửi Ông/Bà: <strong>{stall.Name}</strong> (Tiểu thương sạp <strong>{stall.Code}</strong>),</p>
        <p style=""line-height: 1.6; font-size: 14px; color: #333;"">{message}</p>
        <p style=""color: #666; font-size: 12px; margin-top: 20px;"">Nếu đã thanh toán, vui lòng bỏ qua email này hoặc gửi đối soát trên trang cá nhân.</p>
    </div>
    <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
    <p style=""color: #999; font-size: 11px; text-align: center; margin: 0;"">Đây là email tự động từ hệ thống STMM, vui lòng không trả lời email này.</p>
</div>";

                await _emailService.SendEmailAsync(stall.Email, $"[BQL STMM] Thông báo nhắc nợ phí sạp {stall.Code}", emailBody, ct);
            }

            return true;
        }

        /// <inheritdoc />
        public async Task<IEnumerable<DisputeResolutionDto>> GetInvoiceDisputesAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                marketId = user?.MarketId;
            }

            var disputes = await _requestRepository.GetInvoiceDisputesAsync(marketId, ct);

            return disputes.Select(r => new DisputeResolutionDto
            {
                RequestId = r.RequestId,
                InvoiceId = r.InvoiceId,
                Title = r.Title ?? "Kháng nghị hóa đơn",
                Description = r.Description,
                Status = r.Status ?? "Pending",
                CreatedAt = r.CreatedAt,
                StallCode = r.Stall?.Code ?? "N/A",
                TenantName = r.Vendor?.User?.Name ?? "N/A",
                VendorBankName = r.Vendor?.BankName,
                VendorBankAccount = r.Vendor?.BankAccount,
                InvoiceMonth = r.Invoice?.Month ?? 0,
                InvoiceYear = r.Invoice?.Year ?? 0,
                InvoiceTotalAmount = r.Invoice?.TotalAmount ?? 0,
                InvoiceStatus = r.Invoice?.Status ?? "Unpaid"
            });
        }

        /// <inheritdoc />
        /// <inheritdoc />
        public async Task<bool> ResolveInvoiceDisputeAsync(int requestId, ResolveDisputeRequest request, int accountantUserId, CancellationToken ct = default)
        {
            var dispute = await _requestRepository.GetRequestWithStallAndVendorAsync(requestId, ct);

            if (dispute == null)
            {
                throw new NotFoundException($"Không tìm thấy yêu cầu kháng nghị ID {requestId}");
            }

            using var transaction = await _requestRepository.BeginTransactionAsync(ct);
            try
            {
                dispute.Status = request.Approve ? "Approved" : "Rejected";
                dispute.PayerDecisionNote = request.Feedback;
                dispute.UpdatedAt = DateTime.UtcNow;
                _requestRepository.Update(dispute);

                // Revert invoice nếu nó đang kẹt ở trạng thái "Disputed" (dữ liệu cũ)
                // Với luồng mới, hóa đơn không bị đổi thành Disputed, nhưng cần xử lý dữ liệu cũ
                if (dispute.InvoiceId.HasValue)
                {
                    var invoiceForRevert = await _invoiceRepository.GetByIdAsync(dispute.InvoiceId.Value, ct);
                    if (invoiceForRevert != null && invoiceForRevert.Status == "Disputed")
                    {
                        invoiceForRevert.Status = "Unpaid";
                        _invoiceRepository.Update(invoiceForRevert);
                    }
                }

                string refundMsg = "";
                if (request.Approve && request.IsRefund && request.RefundAmount > 0 && dispute.InvoiceId.HasValue)
                {
                    var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(dispute.InvoiceId.Value, ct);
                    if (invoice != null)
                    {
                        if (request.RefundAmount > invoice.TotalAmount)
                        {
                            throw new BadRequestException("Số tiền hoàn/giảm trừ không được vượt quá tổng tiền của hóa đơn.");
                        }

                        var feeTypeId = invoice.InvoiceDetails.FirstOrDefault()?.FeeTypeId ?? 1;
                        var detail = new InvoiceDetail
                        {
                            InvoiceId = invoice.InvoiceId,
                            Description = invoice.Status == "Paid" ? "Hoàn tiền do giải quyết khiếu nại" : "Giảm trừ do giải quyết khiếu nại hóa đơn",
                            Amount = -request.RefundAmount.Value,
                            UnitPrice = -request.RefundAmount.Value,
                            Quantity = 1,
                            FeeTypeId = feeTypeId
                        };

                        invoice.InvoiceDetails.Add(detail);
                        invoice.TotalAmount -= request.RefundAmount.Value;
                        if (invoice.TotalAmount < 0) invoice.TotalAmount = 0;

                        if (invoice.Status == "Paid")
                        {
                            var originalPayment = invoice.Payments.FirstOrDefault(p => p.Status == "Verified" || p.Status == "Paid");

                            var payment = new Payment
                            {
                                InvoiceId = dispute.InvoiceId.Value,
                                Amount = request.RefundAmount.Value,
                                Method = request.RefundMethod ?? "Cash",
                                TransactionCode = string.IsNullOrWhiteSpace(request.TransactionCode) ? $"RF-REQ-{requestId}" : request.TransactionCode,
                                PaidAt = DateTime.UtcNow,
                                Status = "Refunded",
                                OriginalPaymentId = originalPayment?.PaymentId
                            };
                            await _paymentRepository.AddAsync(payment, ct);
                            
                            string methodText = request.RefundMethod == "Transfer" ? "Chuyển khoản" : "Tiền mặt";
                            refundMsg = $" Ban quản lý đã hoàn lại số tiền {request.RefundAmount.Value:#,##0} VNĐ qua hình thức {methodText}. Hóa đơn của bạn đã được cập nhật lại.";
                        }
                        else if (invoice.Status == "Unpaid" || invoice.Status == "Draft" || invoice.Status == "Disputed")
                        {
                            // Đảm bảo trả về Unpaid sau khi giảm trừ (không để kẹt Disputed)
                            if (invoice.Status == "Disputed") invoice.Status = "Unpaid";
                            refundMsg = $" Hóa đơn của bạn đã được giảm trừ {request.RefundAmount.Value:#,##0} VNĐ.";
                        }
                    }
                }

                var targetUserId = dispute.Vendor?.UserId ?? 0;
                if (targetUserId > 0)
                {
                    var fb = request.Feedback ?? "";
                    if (fb.Length > 50) fb = fb.Substring(0, 47) + "..."; // Shorten feedback to avoid max length error

                    var content = request.Approve
                        ? $"Kháng nghị sạp {dispute.Stall?.Code} ĐƯỢC CHẤP NHẬN.{refundMsg} Phản hồi: {fb}"
                        : $"Kháng nghị sạp {dispute.Stall?.Code} BỊ TỪ CHỐI. Phản hồi: {fb}";

                    await _notificationService.CreateAsync(new CreateNotificationRequest
                    {
                        Title = request.Approve ? "Duyệt kháng nghị hóa đơn" : "Từ chối kháng nghị hóa đơn",
                        Content = content,
                        NotiType = "Request",
                        CreatedByUserId = accountantUserId,
                        TargetUserId = targetUserId
                    }, ct);
                }

                await _requestRepository.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);
                return true;
            }
            catch (DbUpdateConcurrencyException)
            {
                await transaction.RollbackAsync(ct);
                throw new ConflictException("Kháng nghị này đã được cập nhật bởi một người khác. Vui lòng tải lại trang.");
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }

        /// <inheritdoc />
        public async Task<int> AutoGenerateMonthlyInvoicesAsync(int month, int year, int? marketId = null, CancellationToken ct = default)
        {
            var activeContracts = await _contractRepository.GetActiveContractsForBillingAsync(month, year, ct);
            if (marketId.HasValue)
            {
                activeContracts = activeContracts
                    .Where(c => c.Stall?.Area?.MarketId == marketId.Value)
                    .ToList();
            }

            var dueDaysConfig = await _systemConfigRepository.GetSystemConfigByKeyAsync("invoice_due_days", marketId, ct);
            int dueDays = dueDaysConfig != null && int.TryParse(dueDaysConfig.ConfigValue, out var parsedDays) ? parsedDays : 15;

            var rentFeeType = await _feeTypeRepository.GetRentFeeTypeAsync(marketId, ct);
            int rentFeeTypeId = rentFeeType?.FeeTypeId ?? 1;

            int count = 0;
            var newInvoices = new List<Invoice>();

            var existingInvoicesQuery = _invoiceRepository.Query()
                .Where(i => i.Month == month && i.Year == year && i.IsDeleted != true && i.Status != "Canceled")
                .SelectMany(i => i.InvoiceDetails)
                .Where(d => d.FeeTypeId == rentFeeTypeId);
            if (marketId.HasValue)
                existingInvoicesQuery = existingInvoicesQuery.Where(d => d.Invoice.Contract.Stall.Area.MarketId == marketId.Value);
            var existingInvoices = await existingInvoicesQuery.Select(d => d.Invoice.ContractId).ToListAsync(ct);
            var existingContractIds = new HashSet<int>(existingInvoices);

            foreach (var contract in activeContracts)
            {
                if (existingContractIds.Contains(contract.ContractId)) continue;

                decimal rentAmount = CalculateProratedAmount(contract.RentFee, contract.StartDate.ToDateTime(TimeOnly.MinValue), contract.EndDate.ToDateTime(TimeOnly.MinValue), month, year);
                if (rentAmount <= 0) continue;

                decimal totalAmount = rentAmount;
                var activeServices = contract.Stall?.ServiceRegistrations?.Where(sr => sr.Status == "Active").ToList() ?? new List<ServiceRegistration>();
                var validServices = new List<(ServiceRegistration Reg, decimal Amount)>();

                foreach (var reg in activeServices)
                {
                    if (reg.Service == null) continue;

                    bool shouldBill = false;
                    decimal serviceAmount = 0;
                    var regDate = reg.RegisteredAt ?? contract.StartDate.ToDateTime(TimeOnly.MinValue);

                    if (string.Equals(reg.Service.BillingCycle, "Yearly", StringComparison.OrdinalIgnoreCase))
                    {
                        if (regDate.Month == month)
                        {
                            shouldBill = true;
                            serviceAmount = reg.Service.Price;
                        }
                    }
                    else
                    {
                        shouldBill = true;
                        serviceAmount = CalculateProratedAmount(reg.Service.Price, regDate, reg.EndDate, month, year);
                    }

                    if (shouldBill && serviceAmount > 0)
                    {
                        totalAmount += serviceAmount;
                        validServices.Add((reg, serviceAmount));
                    }
                }

                var invoice = new Invoice
                {
                    ContractId = contract.ContractId,
                    Month = month,
                    Year = year,
                    TotalAmount = totalAmount,
                    Status = "Draft",
                    InvoiceType = "Periodic",
                    DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(dueDays)),
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                var rentDetail = new InvoiceDetail
                {
                    FeeTypeId = rentFeeTypeId,
                    Description = $"Tiền thuê sạp {contract.Stall?.Code} tháng {month}/{year}",
                    Quantity = 1,
                    UnitPrice = contract.RentFee,
                    Amount = rentAmount
                };
                invoice.InvoiceDetails.Add(rentDetail);

                foreach (var srv in validServices)
                {
                    if (srv.Reg.Status == "PendingCancellation")
                    {
                        // Hết chu kỳ cũ, đến chu kỳ mới nhưng user đã hủy gia hạn
                        // Cập nhật trạng thái thành Cancelled và không tính phí tháng này
                        srv.Reg.Status = "Cancelled";
                        srv.Reg.CancelledAt = DateTime.UtcNow;
                        _serviceRegistrationRepository.Update(srv.Reg);
                        continue;
                    }

                    var srvDetail = new InvoiceDetail
                    {
                        FeeTypeId = srv.Reg.Service.FeeTypeId,
                        Description = $"{srv.Reg.Service.Name} tháng {month}/{year}",
                        Quantity = 1,
                        UnitPrice = srv.Reg.Service.Price,
                        Amount = srv.Amount
                    };
                    invoice.InvoiceDetails.Add(srvDetail);
                }

                newInvoices.Add(invoice);
            }

            if (newInvoices.Any())
            {
                await _invoiceRepository.AddRangeAsync(newInvoices, ct);
                await _invoiceRepository.SaveChangesAsync(ct);
                count = newInvoices.Count;
            }

            // Log history
            if (count > 0)
            {
                var auditLog = new AuditLog
                {
                    UserId = 1, // System or Admin
                    Action = $"AutoGenerateInvoices_M{month}_Y{year}_C{count}",
                    CreatedAt = DateTime.UtcNow
                };
                await _auditLogRepository.AddAsync(auditLog, ct);
                await _auditLogRepository.SaveChangesAsync(ct);
            }

            return count;
        }

        public async Task<IEnumerable<AutoGenerateHistoryDto>> GetAutoGenerateHistoryAsync(CancellationToken ct = default)
        {
            var logs = await _auditLogRepository.Query()
                .Where(l => l.Action.StartsWith("AutoGenerateInvoices_"))
                .OrderByDescending(l => l.CreatedAt)
                .Take(50)
                .ToListAsync(ct);

            var history = new List<AutoGenerateHistoryDto>();
            foreach (var log in logs)
            {
                var parts = log.Action.Split('_');
                if (parts.Length >= 4 && int.TryParse(parts[1].Replace("M", ""), out int m) && int.TryParse(parts[2].Replace("Y", ""), out int y))
                {
                    int.TryParse(parts[3].Replace("C", ""), out int count);

                    history.Add(new AutoGenerateHistoryDto
                    {
                        LogId = log.LogId,
                        Action = log.Action,
                        CreatedAt = log.CreatedAt,
                        Month = m,
                        Year = y,
                        InvoicesGenerated = count
                    });
                }
            }
            return history;
        }

        public async Task<int> TriggerAutoGenerateAsync(int month, int year, int triggerUserId, CancellationToken ct = default)
        {
            if (month is < 1 or > 12 || year is < 2000 or > 2100)
                throw new BadRequestException("Invalid billing period.");

            var triggerUser = await _userRepository.GetByIdAsync(triggerUserId, ct);
            if (triggerUser == null)
                throw new ForbiddenException("Accountant account was not found.");

            int count = await AutoGenerateMonthlyInvoicesAsync(month, year, triggerUser.MarketId, ct);

            // If manual trigger generated something, log it specifically
            if (count > 0)
            {
                var auditLog = new AuditLog
                {
                    UserId = triggerUserId,
                    Action = $"ManualTriggerInvoices_M{month}_Y{year}_C{count}",
                    CreatedAt = DateTime.UtcNow
                };
                await _auditLogRepository.AddAsync(auditLog, ct);
                await _auditLogRepository.SaveChangesAsync(ct);
            }

            return count;
        }

        private decimal CalculateProratedAmount(decimal fullAmount, DateTime startDate, DateTime? endDate, int targetMonth, int targetYear)
        {
            var targetStart = new DateTime(targetYear, targetMonth, 1);
            var targetEnd = new DateTime(targetYear, targetMonth, DateTime.DaysInMonth(targetYear, targetMonth));

            if (startDate > targetEnd) return 0;
            if (endDate.HasValue && endDate.Value < targetStart) return 0;

            var actualStart = startDate > targetStart ? startDate : targetStart;
            var actualEnd = endDate.HasValue && endDate.Value < targetEnd ? endDate.Value : targetEnd;

            int activeDays = (actualEnd - actualStart).Days + 1;
            int totalDaysInMonth = DateTime.DaysInMonth(targetYear, targetMonth);

            if (activeDays >= totalDaysInMonth) return fullAmount;

            return Math.Round((fullAmount / totalDaysInMonth) * activeDays, 0);
        }

        /// <inheritdoc />
        public async Task<bool> CancelInvoiceAsync(int invoiceId, CancelInvoiceRequest request, int accountantUserId, CancellationToken ct = default)
        {
            int? marketId = null;
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null)
            {
                marketId = accountantUser.MarketId;
            }

            var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoiceId, ct);
            if (invoice == null)
            {
                throw new Exception("Hóa đơn không tồn tại.");
            }

            // Cross-tenant data isolation check
            if (marketId.HasValue && invoice.Contract?.Stall?.Area?.MarketId != marketId.Value)
            {
                throw new Exception("Không có quyền hủy hóa đơn của chợ khác.");
            }

            // Only allow canceling unpaid or draft invoices
            if (invoice.Status != "Unpaid" && invoice.Status != "Draft")
            {
                throw new Exception("Chỉ được phép hủy các hóa đơn ở trạng thái Nháp (Draft) hoặc Chưa thanh toán (Unpaid).");
            }

            invoice.Status = "Canceled";
            
            // Note: If you have a specific database field for CancelReason, you can map it here.
            // For now, we will include the reason in the notification sent to the vendor.

            _invoiceRepository.Update(invoice);
            await _invoiceRepository.SaveChangesAsync(ct);

            // Send notification to Vendor
            if (invoice.Contract?.Vendor != null)
            {
                string reasonText = string.IsNullOrWhiteSpace(request.Reason) ? "Không có lý do cụ thể." : request.Reason;
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    CreatedByUserId = accountantUserId,
                    TargetUserId = invoice.Contract.Vendor.UserId,
                    Title = "Thông báo: Hóa đơn đã bị hủy",
                    Content = $"Hóa đơn kỳ {invoice.Month}/{invoice.Year} cho sạp {invoice.Contract.Stall?.Code} đã bị hủy bởi ban quản lý. Lý do: {reasonText}",
                    NotiType = "Invoice"
                }, ct);
            }

            return true;
        }
    }
}
