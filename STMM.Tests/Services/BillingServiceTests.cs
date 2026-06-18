using AutoMapper;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging.Abstractions;
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
                _validatorMock.Object,
                _emailServiceMock.Object);
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

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(invoiceId, It.IsAny<CancellationToken>()))
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
        public async Task ReceiveCashPaymentAsync_InvoiceNotUnpaid_ThrowsBadRequestException()
        {
            // Arrange
            var staffUserId = 10;
            var invoiceId = 1;
            var request = new ReceiveCashPaymentRequest { InvoiceId = invoiceId };
            var invoice = CreateMockInvoice(invoiceId, "Paid"); // Already paid

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(invoiceId, It.IsAny<CancellationToken>()))
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

            _invoiceRepoMock.Setup(r => r.GetInvoiceWithRelationsForPaymentAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((Invoice?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _service.ReceiveCashPaymentAsync(staffUserId, request));
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
