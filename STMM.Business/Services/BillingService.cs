using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Billing;
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
        private readonly ILogger<BillingService> _logger;
        private readonly FluentValidation.IValidator<ReceiveCashPaymentRequest> _paymentValidator;

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
            ILogger<BillingService> logger,
            FluentValidation.IValidator<ReceiveCashPaymentRequest> paymentValidator)
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
            _logger = logger;
            _paymentValidator = paymentValidator;
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
            var invoice = await _invoiceRepository.GetInvoiceWithRelationsForPaymentAsync(request.InvoiceId, marketId, ct);

            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {request.InvoiceId} not found.");
            }

            if (invoice.Status != "Unpaid")
            {
                throw new BadRequestException(
                    $"Invoice is in status '{invoice.Status}'. Payment can only be collected for 'Unpaid' invoices.");
            }

            var transactionCode = $"CASH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
            var payment = new Payment
            {
                InvoiceId = invoice.InvoiceId,
                Amount = invoice.TotalAmount,
                Method = "Cash",
                TransactionCode = transactionCode,
                PaidAt = DateTime.UtcNow
            };

            await _paymentRepository.AddAsync(payment, ct);

            invoice.Status = "Pending Confirmation";

            var vendor = invoice.Contract.Vendor;
            var stall = invoice.Contract.Stall;

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

            await _invoiceRepository.SaveChangesAsync(ct);

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

            var invoices = await _invoiceRepository.GetDraftInvoicesByIdsAsync(request.InvoiceIds, marketId, ct);

            if (!invoices.Any()) return false;

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
            if (request.Amount <= 0)
            {
                throw new BadRequestException("Số tiền hóa đơn phải lớn hơn 0.");
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

            var invoice = new Invoice
            {
                ContractId = contract.ContractId,
                Month = request.Month,
                Year = request.Year,
                TotalAmount = request.Amount,
                Status = "Unpaid",
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

            await _invoiceRepository.SaveChangesAsync(ct);

            var freshInvoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoice.InvoiceId, ct);
            return MapInvoiceToDto(freshInvoice!);
        }

        /// <inheritdoc />
        public async Task<bool> AdjustMeterReadingAsync(int creatorUserId, MeterReadingAdjustmentRequest request, CancellationToken ct = default)
        {
            // Cross-tenant check
            var accountantUser = await _userRepository.GetByIdAsync(creatorUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                var stallContract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);
                if (stallContract != null && stallContract.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền chỉnh sửa chỉ số điện/nước của sạp thuộc chợ khác.");
                }
            }

            // 1. Get or create active Meter for StallId & Type
            var meter = await _meterRepository.GetActiveMeterByStallAndTypeAsync(request.StallId, request.MeterType, ct);

            if (meter == null)
            {
                meter = new Meter
                {
                    StallId = request.StallId,
                    Type = request.MeterType,
                    SerialNumber = $"MTR-{request.MeterType[0]}-{request.StallId:D3}-{DateTime.UtcNow.Ticks % 10000}",
                    InstalledAt = DateOnly.FromDateTime(DateTime.Today),
                    IsActive = true
                };
                await _meterRepository.AddAsync(meter, ct);
                await _meterRepository.SaveChangesAsync(ct);
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
                    ImageUrl = "N/A",
                    IsSynced = true
                };
                await _meterReadingRepository.AddAsync(reading, ct);
            }
            else
            {
                reading.OldValue = request.OldValue;
                reading.NewValue = request.NewValue;
                reading.CreatedByUserId = creatorUserId;
            }

            await _meterReadingRepository.SaveChangesAsync(ct);

            // 3. Find corresponding Invoice of the stall in this month/year to update
            var contract = await _contractRepository.GetActiveContractByStallIdAsync(request.StallId, ct);

            if (contract != null)
            {
                var invoice = await _invoiceRepository.GetDraftOrUnpaidInvoiceForContractAsync(contract.ContractId, request.Month, request.Year, ct);

                if (invoice != null)
                {
                    double consumption = request.NewValue - request.OldValue;
                    if (consumption < 0) consumption = 0;

                    var feeTypeName = request.MeterType == "Electricity" ? "Điện" : "Nước";
                    var feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync(feeTypeName, null, ct);

                    int feeTypeId = feeType?.FeeTypeId ?? (request.MeterType == "Electricity" ? 2 : 3);
                    decimal unitPrice = request.MeterType == "Electricity" ? 3500 : 18000;

                    var detail = invoice.InvoiceDetails.FirstOrDefault(d => d.FeeTypeId == feeTypeId);
                    if (detail == null)
                    {
                        detail = new InvoiceDetail
                        {
                            InvoiceId = invoice.InvoiceId,
                            FeeTypeId = feeTypeId,
                            Description = $"Tiêu thụ {request.MeterType.ToLower()} {request.Month}/{request.Year} ({request.OldValue} -> {request.NewValue})",
                            Quantity = consumption,
                            UnitPrice = unitPrice,
                            Amount = (decimal)consumption * unitPrice
                        };
                        invoice.InvoiceDetails.Add(detail);
                    }
                    else
                    {
                        detail.Quantity = consumption;
                        detail.Description = $"Tiêu thụ {request.MeterType.ToLower()} {request.Month}/{request.Year} ({request.OldValue} -> {request.NewValue})";
                        detail.Amount = (decimal)consumption * detail.UnitPrice;
                    }

                    invoice.TotalAmount = invoice.InvoiceDetails.Sum(d => d.Amount);
                    await _invoiceRepository.SaveChangesAsync(ct);
                }
            }

            return true;
        }

        /// <summary>
        /// Manual mapping — tránh phức tạp AutoMapper cho nested multi-level relations.
        /// </summary>
        private static InvoiceDto MapInvoiceToDto(Invoice invoice)
        {
            var stall = invoice.Contract?.Stall;
            var vendor = invoice.Contract?.Vendor;
            var vendorUser = vendor?.User;

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

            // Check if the accountant belongs to the same market as the invoice
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser != null && accountantUser.MarketId.HasValue)
            {
                if (invoice.Contract?.Stall?.Area?.MarketId != accountantUser.MarketId)
                {
                    throw new ForbiddenException("Bạn không có quyền duyệt thanh toán cho giao dịch của chợ khác.");
                }
            }

            if (request.Approve)
            {
                // Approve payment: set invoice status to Paid
                invoice.Status = "Paid";
                _invoiceRepository.Update(invoice);

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
                // Reject payment: set invoice status back to Unpaid and delete the payment record
                invoice.Status = "Unpaid";
                _invoiceRepository.Update(invoice);
                
                _paymentRepository.Delete(payment);

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
            return true;
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
                
                var unpaidInvoices = s.Contracts.SelectMany(c => c.Invoices)
                    .Where(i => i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation"))
                    .ToList();

                decimal rentDebt = 0;
                decimal utilityDebt = 0;
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
                        else
                        {
                            utilityDebt += det.Amount;
                        }
                    }
                }

                var unpaidViolations = s.Violations
                      .Where(v => v.Status == "Pending" || v.Status == "Notified" || v.Status == "Appealed" || v.Status == "Rejected")
                    .ToList();

                decimal violationDebt = unpaidViolations.Sum(v => v.FineAmount ?? v.ViolationType?.DefaultFine ?? 0);
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

            var unpaidInvoices = stall.Contracts.SelectMany(c => c.Invoices)
                .Where(i => i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation"))
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

              var unpaidViolations = stall.Violations
                  .Where(v => v.Status == "Pending" || v.Status == "Notified" || v.Status == "Appealed" || v.Status == "Rejected")
                .OrderByDescending(v => v.CreatedAt)
                .Select(v => new UnpaidViolationDetailDto
                {
                    ViolationId = v.ViolationId,
                    Title = v.Title,
                    Description = v.Description,
                    FineAmount = v.FineAmount ?? v.ViolationType?.DefaultFine ?? 0,
                    CreatedAt = v.CreatedAt
                })
                .ToList();

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
        public async Task<bool> ResolveInvoiceDisputeAsync(int requestId, ResolveDisputeRequest request, int accountantUserId, CancellationToken ct = default)
        {
            var dispute = await _requestRepository.GetRequestWithStallAndVendorAsync(requestId, ct);

            if (dispute == null)
            {
                throw new NotFoundException($"Không tìm thấy yêu cầu kháng nghị ID {requestId}");
            }

            dispute.Status = request.Approve ? "Approved" : "Rejected";
            dispute.UpdatedAt = DateTime.UtcNow;
            _requestRepository.Update(dispute);
            
            string refundMsg = "";
            if (request.Approve && request.IsRefund && request.RefundAmount > 0 && dispute.InvoiceId.HasValue)
            {
                var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(dispute.InvoiceId.Value, ct);
                if (invoice != null)
                {
                    if (invoice.Status == "Paid")
                    {
                        var payment = new Payment
                        {
                            InvoiceId = dispute.InvoiceId.Value,
                            Amount = -request.RefundAmount.Value, // Negative amount for refund
                            Method = request.RefundMethod ?? "Cash",
                            TransactionCode = string.IsNullOrWhiteSpace(request.TransactionCode) ? $"RF-REQ-{requestId}" : request.TransactionCode,
                            PaidAt = DateTime.UtcNow
                        };
                        await _paymentRepository.AddAsync(payment, ct);
                        
                        string methodText = request.RefundMethod == "Transfer" ? "Chuyển khoản" : "Tiền mặt";
                        refundMsg = $" Ban quản lý đã hoàn lại số tiền {request.RefundAmount.Value:#,##0} VNĐ qua hình thức {methodText}.";
                    }
                    else if (invoice.Status == "Unpaid" || invoice.Status == "Draft")
                    {
                        var feeTypeId = invoice.InvoiceDetails.FirstOrDefault()?.FeeTypeId ?? 1;
                        var detail = new InvoiceDetail
                        {
                            InvoiceId = invoice.InvoiceId,
                            Description = "Giảm trừ do giải quyết khiếu nại hóa đơn",
                            Amount = -request.RefundAmount.Value,
                            UnitPrice = -request.RefundAmount.Value,
                            Quantity = 1,
                            FeeTypeId = feeTypeId
                        };

                        invoice.InvoiceDetails.Add(detail);
                        invoice.TotalAmount -= request.RefundAmount.Value;
                        if (invoice.TotalAmount < 0) invoice.TotalAmount = 0;
                        
                        _invoiceRepository.Update(invoice);
                        
                        refundMsg = $" Hóa đơn của bạn đã được điều chỉnh giảm trừ số tiền {request.RefundAmount.Value:#,##0} VNĐ.";
                    }
                }
            }

            var targetUserId = dispute.Vendor?.UserId ?? 0;
            if (targetUserId > 0)
            {
                var content = request.Approve
                    ? $"Kháng nghị hóa đơn sạp {dispute.Stall?.Code} của bạn đã ĐƯỢC CHẤP NHẬN.{refundMsg} Kế toán sẽ thực hiện điều chỉnh hóa đơn sớm nhất. Phản hồi: {request.Feedback}"
                    : $"Kháng nghị hóa đơn sạp {dispute.Stall?.Code} của bạn đã BỊ TỪ CHỐI. Phản hồi của Kế toán: {request.Feedback ?? "Không chấp nhận yêu cầu"}";

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
            return true;
        }

        /// <inheritdoc />
        public async Task<int> AutoGenerateMonthlyInvoicesAsync(int month, int year, CancellationToken ct = default)
        {
            // 1. Get all active contracts
            var activeContracts = await _contractRepository.GetAllActiveContractsWithDetailsAsync(ct);

            // Get invoice due days from config
            var dueDaysConfig = await _systemConfigRepository.GetSystemConfigByKeyAsync("invoice_due_days", null, ct);
            int dueDays = dueDaysConfig != null && int.TryParse(dueDaysConfig.ConfigValue, out var parsedDays) ? parsedDays : 15;

            // Get fee types to link correctly
            var rentFeeType = await _feeTypeRepository.GetRentFeeTypeAsync(null, ct);
            int rentFeeTypeId = rentFeeType?.FeeTypeId ?? 1;

            int count = 0;

            foreach (var contract in activeContracts)
            {
                // Check if invoice already exists for this month/year/contract
                var exists = await _invoiceRepository.ExistsInvoiceForContractAsync(contract.ContractId, month, year, ct);

                if (exists) continue;

                // Find active service registrations for this stall
                var activeServices = await _serviceRegistrationRepository.GetActiveServiceRegistrationsByStallIdAsync(contract.StallId, ct);

                decimal totalAmount = contract.RentFee + activeServices.Sum(s => s.Service.Price);

                // Create a new Invoice (Draft status)
                var invoice = new Invoice
                {
                    ContractId = contract.ContractId,
                    Month = month,
                    Year = year,
                    TotalAmount = totalAmount,
                    Status = "Draft",
                    DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(dueDays)),
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                await _invoiceRepository.AddAsync(invoice, ct);
                await _invoiceRepository.SaveChangesAsync(ct);

                // Add Rent Fee detail line
                var rentDetail = new InvoiceDetail
                {
                    InvoiceId = invoice.InvoiceId,
                    FeeTypeId = rentFeeTypeId,
                    Description = $"Tiền thuê sạp {contract.Stall.Code} tháng {month}/{year}",
                    Quantity = 1,
                    UnitPrice = contract.RentFee,
                    Amount = contract.RentFee
                };
                invoice.InvoiceDetails.Add(rentDetail);

                // Add detail lines for registered services
                foreach (var reg in activeServices)
                {
                    var srvDetail = new InvoiceDetail
                    {
                        InvoiceId = invoice.InvoiceId,
                        FeeTypeId = reg.Service.FeeTypeId,
                        Description = $"{reg.Service.Name} tháng {month}/{year}",
                        Quantity = 1,
                        UnitPrice = reg.Service.Price,
                        Amount = reg.Service.Price
                    };
                    invoice.InvoiceDetails.Add(srvDetail);
                }

                await _invoiceRepository.SaveChangesAsync(ct);
                count++;
            }

            return count;
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
