using AutoMapper;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.EntityFrameworkCore.Storage;
using Moq;
using STMM.Business.DTOs.Billing;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.Business.Mappers;
using STMM.Business.Services;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using STMM.Tests.Helpers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace STMM.Tests.Services
{
    public class BillingServiceTests
    {
        private readonly Mock<IInvoiceRepository> _invoiceRepoMock;
        private readonly Mock<IPaymentRepository> _paymentRepoMock;
        private readonly Mock<IContractRepository> _contractRepoMock;
        private readonly Mock<IMeterRepository> _meterRepoMock;
        private readonly Mock<IMeterReadingRepository> _meterReadingRepoMock;
        private readonly Mock<IFeeTypeRepository> _feeTypeRepoMock;
        private readonly Mock<IViolationRepository> _violationRepoMock;
        private readonly Mock<IRequestRepository> _requestRepoMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly Mock<IValidator<ReceiveCashPaymentRequest>> _validatorMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<ISystemConfigRepository> _systemConfigRepoMock;
        private readonly Mock<IServiceRegistrationRepository> _serviceRegistrationRepoMock;
        private readonly Mock<IStallRepository> _stallRepoMock;
        private readonly Mock<IAuditLogRepository> _auditLogRepoMock;
        private readonly Mock<IValidator<MeterReadingAdjustmentRequest>> _meterAdjustmentValidatorMock;
        private readonly IMapper _mapper;
        private readonly BillingService _service;

        public BillingServiceTests()
        {
            _invoiceRepoMock = new Mock<IInvoiceRepository>();
            _paymentRepoMock = new Mock<IPaymentRepository>();
            _contractRepoMock = new Mock<IContractRepository>();
            _meterRepoMock = new Mock<IMeterRepository>();
            _meterReadingRepoMock = new Mock<IMeterReadingRepository>();
            _feeTypeRepoMock = new Mock<IFeeTypeRepository>();
            _violationRepoMock = new Mock<IViolationRepository>();
            _requestRepoMock = new Mock<IRequestRepository>();
            _notificationServiceMock = new Mock<INotificationService>();
            _validatorMock = new Mock<IValidator<ReceiveCashPaymentRequest>>();
            _emailServiceMock = new Mock<IEmailService>();
            _userRepoMock = new Mock<IUserRepository>();
            _systemConfigRepoMock = new Mock<ISystemConfigRepository>();
            _serviceRegistrationRepoMock = new Mock<IServiceRegistrationRepository>();
            _stallRepoMock = new Mock<IStallRepository>();
            _auditLogRepoMock = new Mock<IAuditLogRepository>();
            _meterAdjustmentValidatorMock = new Mock<IValidator<MeterReadingAdjustmentRequest>>();
            _userRepoMock.Setup(repository => repository.GetUserByIdWithRoleAsync(
                    It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User { UserId = 1, MarketId = 10 });
            var transaction = new Mock<IDbContextTransaction>();
            transaction.Setup(item => item.CommitAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            transaction.Setup(item => item.RollbackAsync(It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            _invoiceRepoMock.Setup(repository => repository.BeginTransactionAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(transaction.Object);
            _invoiceRepoMock.Setup(repository => repository.LockInvoiceForPaymentAsync(
                    It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(true);

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            }, NullLoggerFactory.Instance);
            _mapper = mapperConfig.CreateMapper();

            _service = new BillingService(
                _invoiceRepoMock.Object,
                _paymentRepoMock.Object,
                _contractRepoMock.Object,
                _meterRepoMock.Object,
                _meterReadingRepoMock.Object,
                _feeTypeRepoMock.Object,
                _violationRepoMock.Object,
                _requestRepoMock.Object,
                _mapper,
                _notificationServiceMock.Object,
                _emailServiceMock.Object,
                _userRepoMock.Object,
                _systemConfigRepoMock.Object,
                _serviceRegistrationRepoMock.Object,
                _stallRepoMock.Object,
                _auditLogRepoMock.Object,
                NullLogger<BillingService>.Instance,
                _validatorMock.Object,
                _meterAdjustmentValidatorMock.Object,
                new Mock<FluentValidation.IValidator<STMM.Business.DTOs.Billing.CreateAdHocInvoiceRequest>>().Object);
        }

        [Fact]
        public async Task GetInvoiceDetailAsync_ValidId_ReturnsInvoiceDto()
        {
            // Arrange
            var invoiceId = 1;
            var invoice = CreateMockInvoice(invoiceId, "Unpaid");

            _invoiceRepoMock.Setup(r => r.GetInvoiceDetailsWithRelationsAsync(invoiceId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invoice);

            // Act
            var result = await _service.GetInvoiceDetailAsync(invoiceId);

            // Assert
            result.Should().NotBeNull();
            result.InvoiceId.Should().Be(invoiceId);
            result.StallCode.Should().Be("A-102");
            result.VendorName.Should().Be("Test Vendor");
        }

        [Fact]
        public async Task GetInvoiceDetailAsync_NotFound_ThrowsNotFoundException()
        {
            // Arrange
            _invoiceRepoMock.Setup(r => r.GetInvoiceDetailsWithRelationsAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Invoice?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _service.GetInvoiceDetailAsync(999));
        }

        [Fact]
        public async Task ReceiveCashPaymentAsync_ValidRequest_CreatesPaymentAndUpdatesInvoiceStatus()
        {
            // Arrange
            var staffUserId = 10;
            var invoiceId = 1;
            var request = new ReceiveCashPaymentRequest { InvoiceId = invoiceId };
            var invoice = CreateMockInvoice(invoiceId, "Unpaid");

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(invoiceId, 10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invoice);

            _paymentRepoMock.Setup(r => r.AddAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _notificationServiceMock.Setup(n => n.CreateAsync(It.IsAny<CreateNotificationRequest>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            _invoiceRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _service.ReceiveCashPaymentAsync(staffUserId, request);

            // Assert
            result.Should().NotBeNull();
            result.InvoiceId.Should().Be(invoiceId);
            result.NewInvoiceStatus.Should().Be("Pending Confirmation");
            result.Amount.Should().Be(invoice.TotalAmount);
            result.Method.Should().Be("Cash");

            _paymentRepoMock.Verify(r => r.AddAsync(It.Is<Payment>(p =>
                p.InvoiceId == invoiceId &&
                p.Amount == invoice.TotalAmount &&
                p.Method == "Cash"
            ), It.IsAny<CancellationToken>()), Times.Once);

            _notificationServiceMock.Verify(n => n.CreateAsync(It.Is<CreateNotificationRequest>(r =>
                r.TargetUserId == invoice.Contract.Vendor.UserId &&
                r.NotiType == "Invoice" &&
                r.CreatedByUserId == staffUserId
            ), It.IsAny<CancellationToken>()), Times.Once);

            _invoiceRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ReceiveCashPaymentAsync_WhenNotificationFails_StillSavesPayment()
        {
            var request = new ReceiveCashPaymentRequest { InvoiceId = 1 };
            var invoice = CreateMockInvoice(1, "Unpaid");
            _validatorMock.Setup(validator => validator.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());
            _invoiceRepoMock.Setup(repository => repository.GetInvoiceWithRelationsForPaymentAsync(
                    1, 10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invoice);
            _notificationServiceMock.Setup(service => service.CreateAsync(
                    It.IsAny<CreateNotificationRequest>(), It.IsAny<CancellationToken>()))
                .ThrowsAsync(new InvalidOperationException("Notification unavailable"));
            _invoiceRepoMock.Setup(repository => repository.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var result = await _service.ReceiveCashPaymentAsync(10, request);

            result.NewInvoiceStatus.Should().Be("Pending Confirmation");
            _paymentRepoMock.Verify(repository => repository.AddAsync(
                It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Once);
            _invoiceRepoMock.Verify(repository => repository.SaveChangesAsync(
                It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task ReceiveCashPaymentAsync_InvoiceNotUnpaid_ThrowsBadRequestException()
        {
            // Arrange
            var staffUserId = 10;
            var invoiceId = 1;
            var request = new ReceiveCashPaymentRequest { InvoiceId = invoiceId };
            var invoice = CreateMockInvoice(invoiceId, "Paid"); // Already paid

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(invoiceId, 10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invoice);

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.ReceiveCashPaymentAsync(staffUserId, request));
        }

        [Fact]
        public async Task ReceiveCashPaymentAsync_InvoiceNotFound_ThrowsNotFoundException()
        {
            // Arrange
            var staffUserId = 10;
            var request = new ReceiveCashPaymentRequest { InvoiceId = 999 };

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(It.IsAny<int>(), 10, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Invoice?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _service.ReceiveCashPaymentAsync(staffUserId, request));
        }

        [Fact]
        public async Task ReceiveCashPaymentAsync_WhenInvoiceIsLockedOutsideStaffMarket_ThrowsNotFoundWithoutCreatingPayment()
        {
            var request = new ReceiveCashPaymentRequest { InvoiceId = 999 };
            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());
            _invoiceRepoMock.Setup(r => r.LockInvoiceForPaymentAsync(999, 10, It.IsAny<CancellationToken>()))
                .ReturnsAsync(false);

            await Assert.ThrowsAsync<NotFoundException>(() => _service.ReceiveCashPaymentAsync(10, request));

            _paymentRepoMock.Verify(r => r.AddAsync(It.IsAny<Payment>(), It.IsAny<CancellationToken>()), Times.Never);
            _invoiceRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task VerifyPaymentAsync_DifferentMarket_ThrowsForbiddenException()
        {
            // Arrange
            var paymentId = 1;
            var accountantUserId = 10;
            var request = new VerifyPaymentRequest { Approve = true };

            // Accountant belongs to MarketId = 1
            var accountant = new User { UserId = accountantUserId, MarketId = 1 };
            _userRepoMock.Setup(r => r.GetByIdAsync(accountantUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(accountant);

            // Invoice belongs to Stall in MarketId = 2
            var area = new Area { AreaId = 1, MarketId = 2 };
            var stall = new Stall { StallId = 1, Area = area };
            var contract = new Contract { ContractId = 1, Stall = stall };
            var invoice = new Invoice { InvoiceId = 1, Status = "Pending Confirmation", Contract = contract };
            var payment = new Payment { PaymentId = paymentId, Status = "Pending", InvoiceId = 1, Invoice = invoice };

            _paymentRepoMock.Setup(r => r.GetPaymentWithInvoiceAndVendorAsync(paymentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(payment);

            // Act & Assert
            await Assert.ThrowsAsync<ForbiddenException>(() => _service.VerifyPaymentAsync(paymentId, request, accountantUserId));
        }

        [Fact]
        public async Task VerifyPaymentAsync_AlreadyVerified_ThrowsBadRequestException()
        {
            // Arrange
            var paymentId = 1;
            var accountantUserId = 10;
            var request = new VerifyPaymentRequest { Approve = true };

            // Accountant and Market match
            var accountant = new User { UserId = accountantUserId, MarketId = 1 };
            _userRepoMock.Setup(r => r.GetByIdAsync(accountantUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(accountant);

            var area = new Area { AreaId = 1, MarketId = 1 };
            var stall = new Stall { StallId = 1, Area = area };
            var contract = new Contract { ContractId = 1, Stall = stall };
            
            // Payment is already Verified
            var invoice = new Invoice { InvoiceId = 1, Status = "Paid", Contract = contract };
            var payment = new Payment { PaymentId = paymentId, Status = "Verified", InvoiceId = 1, Invoice = invoice };

            _paymentRepoMock.Setup(r => r.GetPaymentWithInvoiceAndVendorAsync(paymentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(payment);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.VerifyPaymentAsync(paymentId, request, accountantUserId));
            ex.Message.Should().Be("Payment is no longer pending verification.");
        }

        [Fact]
        public async Task CreateAdHocInvoiceAsync_Duplicate_ThrowsBadRequestException()
        {
            // Arrange
            var accountantUserId = 10;
            var request = new CreateAdHocInvoiceRequest
            {
                StallId = 1,
                Month = 5,
                Year = 2026,
                FeeTypeId = 1,
                Amount = 100000,
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7))
            };

            var feeType = new FeeType { FeeTypeId = 1, Name = "Adhoc Fee" };
            _feeTypeRepoMock.Setup(r => r.GetByIdAsync(1, It.IsAny<CancellationToken>())).ReturnsAsync(feeType);

            var stall = new Stall { StallId = 1, Area = new Area { MarketId = 1 } };
            var contract = new Contract { ContractId = 1, StallId = 1, Stall = stall };
            _contractRepoMock.Setup(r => r.GetActiveContractByStallIdAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(contract);

            var accountant = new User { UserId = accountantUserId, MarketId = 1 };
            _userRepoMock.Setup(r => r.GetByIdAsync(accountantUserId, It.IsAny<CancellationToken>())).ReturnsAsync(accountant);

            // Simulate that an AdHoc invoice already exists
            var existingInvoices = new List<Invoice> 
            { 
                new Invoice { ContractId = 1, Month = 5, Year = 2026, InvoiceType = "AdHoc", Status = "Unpaid", IsDeleted = false } 
            }.AsQueryable();
            
            _invoiceRepoMock.Setup(r => r.Query()).Returns(existingInvoices.ToAsyncQueryable());

            // Act & Assert
            var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAdHocInvoiceAsync(request, accountantUserId));
            ex.Message.Should().Be("An ad-hoc invoice already exists for this contract and billing period.");
        }

        [Fact]
        public async Task ResolveInvoiceDisputeAsync_AmountExceedsLimit_ThrowsBadRequestException()
        {
            // Arrange
            var requestId = 1;
            var accountantUserId = 10;
            var request = new ResolveDisputeRequest
            {
                Approve = true,
                IsRefund = true,
                RefundAmount = 5000000 // invoice amount is 2500000
            };

            var dispute = new Request { RequestId = requestId, RequestType = "InvoiceDispute", Status = "Pending", InvoiceId = 1, Invoice = new Invoice { TotalAmount = 2500000 }, Stall = new Stall { Code = "TEST" }, Vendor = new Vendor { UserId = 5 } };
            _requestRepoMock.Setup(r => r.GetRequestWithStallAndVendorAsync(requestId, It.IsAny<CancellationToken>())).ReturnsAsync(dispute);

            var accountant = new User { UserId = accountantUserId, MarketId = 1 };
            _userRepoMock.Setup(r => r.GetByIdAsync(accountantUserId, It.IsAny<CancellationToken>())).ReturnsAsync(accountant);
            
            var invoice = CreateMockInvoice(1, "Paid");
            // Set area market id so it matches accountant
            invoice.Contract.Stall.Area = new Area { MarketId = 1 };

            _invoiceRepoMock.Setup(r => r.GetInvoiceDetailsWithRelationsAsync(1, It.IsAny<CancellationToken>()))
                .ReturnsAsync(invoice);

            _requestRepoMock.Setup(r => r.BeginTransactionAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(new Mock<IDbContextTransaction>().Object);

            // Act & Assert
            var ex = await Assert.ThrowsAsync<BadRequestException>(() => _service.ResolveInvoiceDisputeAsync(requestId, request, accountantUserId));
            ex.Message.Should().Be("Số tiền hoàn/giảm trừ không được vượt quá tổng tiền của hóa đơn.");
        }

        private static Invoice CreateMockInvoice(int invoiceId, string status)
        {
            var user = new User { UserId = 5, Phone = "0987654321", Name = "Vendor User" };
            var vendor = new Vendor { VendorId = 2, UserId = 5, BusinessName = "Test Vendor", User = user };
            var stall = new Stall { StallId = 3, Code = "A-102", Category = new BusinessCategory { Name = "Fashion", Code = "FASHION" }, IsDeleted = false };
            var contract = new Contract { ContractId = 4, StallId = 3, VendorId = 2, Stall = stall, Vendor = vendor, Status = "Active", IsDeleted = false };

            return new Invoice
            {
                InvoiceId = invoiceId,
                ContractId = 4,
                Month = 5,
                Year = 2026,
                TotalAmount = 2500000,
                Status = status,
                DueDate = new DateOnly(2026, 5, 25),
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false,
                Contract = contract,
                InvoiceDetails = new List<InvoiceDetail>
                {
                    new() { InvoiceDetailId = 1, FeeTypeId = 1, Amount = 2000000, Quantity = 1, UnitPrice = 2000000, FeeType = new FeeType { FeeTypeId = 1, Name = "Rent" } },
                    new() { InvoiceDetailId = 2, FeeTypeId = 2, Amount = 500000, Quantity = 50, UnitPrice = 10000, FeeType = new FeeType { FeeTypeId = 2, Name = "Electricity" } }
                },
                Payments = new List<Payment>()
            };
        }
    }
}
