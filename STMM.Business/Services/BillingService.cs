using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.UnitOfWork;

namespace STMM.Business.Services
{
    public class BillingService : BaseService, IBillingService
    {
        private readonly INotificationService _notificationService;
        private readonly IValidator<ReceiveCashPaymentRequest> _paymentValidator;

        public BillingService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            INotificationService notificationService,
            IValidator<ReceiveCashPaymentRequest> paymentValidator)
            : base(unitOfWork, mapper)
        {
            _notificationService = notificationService;
            _paymentValidator = paymentValidator;
        }

        /// <inheritdoc />
        public async Task<InvoiceDto> GetInvoiceDetailAsync(int invoiceId, CancellationToken ct = default)
        {
            var invoice = await _unitOfWork.Repository<Invoice>()
                .Query()
                .Include(i => i.InvoiceDetails)
                    .ThenInclude(d => d.FeeType)
                .Include(i => i.Payments)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.InvoiceId == invoiceId && i.IsDeleted != true, ct);

            if (invoice == null)
            {
                throw new NotFoundException($"Không tìm thấy hóa đơn với Id = {invoiceId}.");
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

            // Load invoice with relations (tracking enabled for update)
            var invoice = await _unitOfWork.Repository<Invoice>()
                .Query()
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(i => i.Contract)
                    .ThenInclude(c => c.Stall)
                        .ThenInclude(s => s.Category)
                .FirstOrDefaultAsync(i => i.InvoiceId == request.InvoiceId && i.IsDeleted != true, ct);

            if (invoice == null)
            {
                throw new NotFoundException($"Không tìm thấy hóa đơn với Id = {request.InvoiceId}.");
            }

            // BR-31 + BR-38c: Chỉ thu được hóa đơn Unpaid
            if (invoice.Status != "Unpaid")
            {
                throw new BadRequestException(
                    $"Hóa đơn đang ở trạng thái '{invoice.Status}'. Chỉ có thể thu tiền cho hóa đơn 'Unpaid'.");
            }

            // Tạo payment record — thu đủ 100% (BR-36)
            var transactionCode = $"CASH-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..8].ToUpper()}";
            var payment = new Payment
            {
                InvoiceId = invoice.InvoiceId,
                Amount = invoice.TotalAmount,
                Method = "Cash",
                TransactionCode = transactionCode,
                PaidAt = DateTime.UtcNow
            };

            await _unitOfWork.Repository<Payment>().AddAsync(payment, ct);

            // BR-38c: Cash → Pending Confirmation (chờ Kế toán phê duyệt)
            invoice.Status = "Pending Confirmation";

            // Gửi notification cho Vendor
            var vendor = invoice.Contract.Vendor;
            var stall = invoice.Contract.Stall;

            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = "Ghi nhận thu tiền mặt",
                Content = $"Nhân viên đã ghi nhận thu tiền mặt hóa đơn tháng {invoice.Month}/{invoice.Year} " +
                          $"tại sạp {stall.Code} số tiền {invoice.TotalAmount:#,##0} VNĐ. " +
                          $"Vui lòng chờ kế toán xác nhận.",
                NotiType = "Invoice",
                CreatedByUserId = staffUserId,
                TargetUserId = vendor.UserId
            }, ct);

            // Save all changes in 1 transaction
            await _unitOfWork.SaveChangesAsync(ct);

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
