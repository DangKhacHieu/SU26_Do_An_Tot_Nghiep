using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
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
        private readonly IValidator<ReceiveCashPaymentRequest> _paymentValidator;
        private readonly IEmailService _emailService;

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
            IValidator<ReceiveCashPaymentRequest> paymentValidator,
            IEmailService emailService)
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
            _paymentValidator = paymentValidator;
            _emailService = emailService;
        }

        /// <inheritdoc />
        public async Task<InvoiceDto> GetInvoiceDetailAsync(int invoiceId, CancellationToken ct = default)
        {
            var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(invoiceId, ct);

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
            // Validate request
            var validationResult = await _paymentValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Load invoice with relations
            var invoice = await _invoiceRepository.GetInvoiceWithRelationsForPaymentAsync(request.InvoiceId, ct);

            if (invoice == null)
            {
                throw new NotFoundException($"Invoice with ID {request.InvoiceId} not found.");
            }

            // Only unpaid invoices can be collected
            if (invoice.Status != "Unpaid")
            {
                throw new BadRequestException(
                    $"Invoice is in status '{invoice.Status}'. Payment can only be collected for 'Unpaid' invoices.");
            }

            // Create payment record - collect 100% of amount
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

            // Set status to pending confirmation
            invoice.Status = "Pending Confirmation";

            // Send notification to Vendor
            var vendor = invoice.Contract.Vendor;
            var stall = invoice.Contract.Stall;

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

            // Save all changes in 1 transaction
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
        public async Task<IEnumerable<InvoiceDto>> GetInvoicesAsync(int? month, int? year, string? status, string? search, CancellationToken ct = default)
        {
            var query = _invoiceRepository.Query()
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Where(i => i.IsDeleted != true);

            if (month.HasValue && month.Value > 0)
            {
                query = query.Where(i => i.Month == month.Value);
            }
            if (year.HasValue && year.Value > 0)
            {
                query = query.Where(i => i.Year == year.Value);
            }
            if (!string.IsNullOrEmpty(status) && status != "all")
            {
                query = query.Where(i => i.Status == status);
            }
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(i => i.InvoiceId.ToString().Contains(searchLower) || 
                                     i.Contract.Stall.Code.ToLower().Contains(searchLower) || 
                                     i.Contract.Vendor.User.Name.ToLower().Contains(searchLower) ||
                                     i.Contract.Vendor.BusinessName.ToLower().Contains(searchLower));
            }

            var invoices = await query.OrderByDescending(i => i.InvoiceId).ToListAsync(ct);
            return invoices.Select(MapInvoiceToDto);
        }

        /// <inheritdoc />
        public async Task<bool> BulkApproveInvoicesAsync(BulkApproveInvoicesRequest request, CancellationToken ct = default)
        {
            if (request == null || !request.InvoiceIds.Any()) return false;

            var invoices = await _invoiceRepository.Query()
                .Where(i => request.InvoiceIds.Contains(i.InvoiceId) && i.Status == "Draft" && i.IsDeleted != true)
                .ToListAsync(ct);

            if (!invoices.Any()) return false;

            foreach (var invoice in invoices)
            {
                invoice.Status = "Unpaid";
                if (!invoice.DueDate.HasValue)
                {
                    invoice.DueDate = DateOnly.FromDateTime(DateTime.Today.AddDays(15));
                }
            }

            await _invoiceRepository.SaveChangesAsync(ct);
            return true;
        }

        /// <inheritdoc />
        public async Task<InvoiceDto> CreateAdHocInvoiceAsync(CreateAdHocInvoiceRequest request, CancellationToken ct = default)
        {
            var contract = await _contractRepository.Query()
                .Include(c => c.Stall)
                .Include(c => c.Vendor)
                    .ThenInclude(v => v.User)
                .Where(c => c.StallId == request.StallId && c.Status == "Active" && c.IsDeleted != true)
                .FirstOrDefaultAsync(ct);

            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng hoạt động cho gian hàng ID {request.StallId}.");
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
            // 1. Get or create active Meter for StallId & Type
            var meter = await _meterRepository.Query()
                .Where(m => m.StallId == request.StallId && m.Type == request.MeterType && m.IsActive == true)
                .FirstOrDefaultAsync(ct);

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
            var reading = await _meterReadingRepository.Query()
                .Where(mr => mr.MeterId == meter.MeterId && 
                             mr.RecordedAt.Month == request.Month && 
                             mr.RecordedAt.Year == request.Year)
                .FirstOrDefaultAsync(ct);

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
            var contract = await _contractRepository.Query()
                .Where(c => c.StallId == request.StallId && c.Status == "Active" && c.IsDeleted != true)
                .FirstOrDefaultAsync(ct);

            if (contract != null)
            {
                var invoice = await _invoiceRepository.Query()
                    .Include(i => i.InvoiceDetails)
                        .ThenInclude(d => d.FeeType)
                    .Where(i => i.ContractId == contract.ContractId && 
                                 i.Month == request.Month && 
                                 i.Year == request.Year && 
                                 i.IsDeleted != true &&
                                 (i.Status == "Draft" || i.Status == "Unpaid"))
                    .FirstOrDefaultAsync(ct);

                if (invoice != null)
                {
                    double consumption = request.NewValue - request.OldValue;
                    if (consumption < 0) consumption = 0;

                    var feeTypeName = request.MeterType == "Electricity" ? "Điện" : "Nước";
                    var feeType = await _feeTypeRepository.Query()
                        .Where(f => f.Name.Contains(feeTypeName))
                        .FirstOrDefaultAsync(ct);

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
        public async Task<IEnumerable<PaymentVerificationDto>> GetPendingPaymentsAsync(CancellationToken ct = default)
        {
            var payments = await _paymentRepository.Query()
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Stall)
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                            .ThenInclude(v => v.User)
                .OrderByDescending(p => p.PaidAt)
                .ToListAsync(ct);

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
            var payment = await _paymentRepository.Query()
                .Include(p => p.Invoice)
                    .ThenInclude(i => i.Contract)
                        .ThenInclude(c => c.Vendor)
                .FirstOrDefaultAsync(p => p.PaymentId == paymentId, ct);

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
        public async Task<IEnumerable<DebtOfStallDto>> GetStallsDebtListAsync(string? search, CancellationToken ct = default)
        {
            var stalls = await _contractRepository.Query()
                .Select(c => c.Stall)
                .Distinct()
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                        .ThenInclude(i => i.InvoiceDetails)
                            .ThenInclude(d => d.FeeType)
                .Include(s => s.Violations)
                    .ThenInclude(v => v.ViolationType)
                .ToListAsync(ct);

            if (!string.IsNullOrWhiteSpace(search))
            {
                var sLower = search.ToLower();
                stalls = stalls.Where(s => s.Code.ToLower().Contains(sLower) || 
                                          (s.Contracts.FirstOrDefault(c => c.Status == "Active")?.Vendor?.User?.Name ?? "").ToLower().Contains(sLower)).ToList();
            }

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
                    .Where(v => v.Status == "Unpaid")
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
        public async Task<StallDebtDetailDto> GetStallDebtDetailsAsync(int stallId, CancellationToken ct = default)
        {
            var stall = await _contractRepository.Query()
                .Where(c => c.StallId == stallId)
                .Select(c => c.Stall)
                .Distinct()
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                        .ThenInclude(i => i.InvoiceDetails)
                            .ThenInclude(d => d.FeeType)
                .Include(s => s.Violations)
                    .ThenInclude(v => v.ViolationType)
                .FirstOrDefaultAsync(ct);

            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp ID {stallId}");
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
                .Where(v => v.Status == "Unpaid")
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
            var stall = await _contractRepository.Query()
                .Where(c => c.StallId == request.StallId && c.Status == "Active")
                .Select(c => new { c.Stall.Code, c.Vendor.UserId, Email = c.Vendor.User.Email, Name = c.Vendor.User.Name })
                .FirstOrDefaultAsync(ct);

            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp hoạt động ID {request.StallId} để gửi nhắc nợ.");
            }

            var unpaidInvoicesSum = await _invoiceRepository.Query()
                .Where(i => i.Contract.StallId == request.StallId && i.IsDeleted != true && (i.Status == "Unpaid" || i.Status == "Pending Confirmation"))
                .SumAsync(i => i.TotalAmount, ct);

            var violations = await _violationRepository.Query()
                .Include(v => v.ViolationType)
                .Where(v => v.StallId == request.StallId && v.Status == "Unpaid")
                .ToListAsync(ct);
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
        public async Task<IEnumerable<DisputeResolutionDto>> GetInvoiceDisputesAsync(CancellationToken ct = default)
        {
            var disputes = await _requestRepository.Query()
                .Include(r => r.Invoice)
                .Include(r => r.Stall)
                .Include(r => r.Vendor)
                    .ThenInclude(v => v.User)
                .Where(r => r.RequestType == "InvoiceDispute")
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync(ct);

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
                InvoiceMonth = r.Invoice?.Month ?? 0,
                InvoiceYear = r.Invoice?.Year ?? 0,
                InvoiceTotalAmount = r.Invoice?.TotalAmount ?? 0
            });
        }

        /// <inheritdoc />
        public async Task<bool> ResolveInvoiceDisputeAsync(int requestId, ResolveDisputeRequest request, int accountantUserId, CancellationToken ct = default)
        {
            var dispute = await _requestRepository.Query()
                .Include(r => r.Stall)
                .Include(r => r.Vendor)
                .FirstOrDefaultAsync(r => r.RequestId == requestId, ct);

            if (dispute == null)
            {
                throw new NotFoundException($"Không tìm thấy yêu cầu kháng nghị ID {requestId}");
            }

            dispute.Status = request.Approve ? "Approved" : "Rejected";
            dispute.UpdatedAt = DateTime.UtcNow;
            _requestRepository.Update(dispute);

            var targetUserId = dispute.Vendor?.UserId ?? 0;
            if (targetUserId > 0)
            {
                var content = request.Approve
                    ? $"Kháng nghị hóa đơn sạp {dispute.Stall?.Code} của bạn đã ĐƯỢC CHẤP NHẬN. Kế toán sẽ thực hiện điều chỉnh hóa đơn sớm nhất. Phản hồi: {request.Feedback}"
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
    }
}
