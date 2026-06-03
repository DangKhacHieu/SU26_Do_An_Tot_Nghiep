using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class BillingService : IBillingService
    {
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IPaymentRepository _paymentRepository;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IValidator<ReceiveCashPaymentRequest> _paymentValidator;

        public BillingService(
            IInvoiceRepository invoiceRepository,
            IPaymentRepository paymentRepository,
            IMapper mapper,
            INotificationService notificationService,
            IValidator<ReceiveCashPaymentRequest> paymentValidator)
        {
            _invoiceRepository = invoiceRepository;
            _paymentRepository = paymentRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _paymentValidator = paymentValidator;
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
                VendorName = vendor?.BusinessName ?? string.Empty,
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
    }
}
