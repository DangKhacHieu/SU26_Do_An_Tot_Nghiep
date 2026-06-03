using AutoMapper;
using FluentAssertions;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using FluentValidation.Results;
using Moq;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;
using STMM.Business.Exceptions;
using STMM.Business.Mappers;
using STMM.Business.Services;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using STMM.Tests.Helpers;
using STMM.Business.Interfaces;

namespace STMM.Tests.Services
{
    public class ViolationServiceTests
    {
        private readonly Mock<IViolationRepository> _violationRepoMock;
        private readonly Mock<IStallRepository> _stallRepoMock;
        private readonly Mock<IViolationTypeRepository> _violationTypeRepoMock;
        private readonly Mock<IValidator<CreateViolationRequest>> _validatorMock;
        private readonly Mock<INotificationService> _notificationServiceMock;
        private readonly IMapper _mapper;
        private readonly ViolationService _service;

        public ViolationServiceTests()
        {
            _violationRepoMock = new Mock<IViolationRepository>();
            _stallRepoMock = new Mock<IStallRepository>();
            _violationTypeRepoMock = new Mock<IViolationTypeRepository>();
            _validatorMock = new Mock<IValidator<CreateViolationRequest>>();
            _notificationServiceMock = new Mock<INotificationService>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            }, NullLoggerFactory.Instance);
            _mapper = mapperConfig.CreateMapper();

            _service = new ViolationService(
                _violationRepoMock.Object,
                _stallRepoMock.Object,
                _violationTypeRepoMock.Object,
                _mapper,
                _validatorMock.Object,
                _notificationServiceMock.Object);
        }

        #region GetViolationsAsync

        [Fact]
        public async Task GetViolationsAsync_ValidUser_ReturnsPagedViolations()
        {
            // Arrange
            var userId = 1;
            var violations = new List<Violation>
            {
                CreateViolation(1, userId, "Vi phạm 1"),
                CreateViolation(2, userId, "Vi phạm 2"),
                CreateViolation(3, userId, "Vi phạm 3")
            };

            _violationRepoMock.Setup(r => r.GetViolationsPagedAsync(userId, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((violations.Take(2), 3));

            var queryParams = new ViolationQueryParams { PageNumber = 1, PageSize = 2 };

            // Act
            var result = await _service.GetViolationsAsync(userId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(3);
            result.Items.Should().HaveCount(2);
            result.PageNumber.Should().Be(1);
            result.PageSize.Should().Be(2);
        }

        [Fact]
        public async Task GetViolationsAsync_FilterByStatus_ReturnsFilteredResults()
        {
            // Arrange
            var userId = 1;
            var violations = new List<Violation>
            {
                CreateViolation(1, userId, "Vi phạm 1", status: "Pending"),
                CreateViolation(2, userId, "Vi phạm 2", status: "Finalized"),
                CreateViolation(3, userId, "Vi phạm 3", status: "Pending")
            };

            _violationRepoMock.Setup(r => r.GetViolationsPagedAsync(userId, "Pending", It.IsAny<bool>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Violation> { violations[0], violations[2] }, 2));

            var queryParams = new ViolationQueryParams { Status = "Pending" };

            // Act
            var result = await _service.GetViolationsAsync(userId, queryParams);

            // Assert
            result.TotalCount.Should().Be(2);
            result.Items.Should().AllSatisfy(v => v.Status.Should().Be("Pending"));
        }

        [Fact]
        public async Task GetViolationsAsync_OtherUser_ReturnsEmptyList()
        {
            // Arrange
            var violations = new List<Violation>
            {
                CreateViolation(1, userId: 1, "Vi phạm 1")
            };

            _violationRepoMock.Setup(r => r.GetViolationsPagedAsync(999, It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Violation>(), 0));

            // Act — query as user 999 who has no violations
            var result = await _service.GetViolationsAsync(999, new ViolationQueryParams());

            // Assert
            result.TotalCount.Should().Be(0);
            result.Items.Should().BeEmpty();
        }

        #endregion

        #region GetViolationByIdAsync

        [Fact]
        public async Task GetViolationByIdAsync_ValidIdAndUser_ReturnsViolationDto()
        {
            // Arrange
            var userId = 1;
            var violations = new List<Violation> { CreateViolation(10, userId, "Test violation") };

            _violationRepoMock.Setup(r => r.GetViolationWithStallAsync(10, userId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(violations[0]);

            // Act
            var result = await _service.GetViolationByIdAsync(10, userId);

            // Assert
            result.Should().NotBeNull();
            result.ViolationId.Should().Be(10);
            result.Title.Should().Be("Test violation");
        }

        [Fact]
        public async Task GetViolationByIdAsync_NotFound_ThrowsNotFoundException()
        {
            // Arrange
            var violations = new List<Violation>();
            _violationRepoMock.Setup(r => r.GetViolationWithStallAsync(999, 1, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Violation?)null);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(
                () => _service.GetViolationByIdAsync(999, 1));
        }

        [Fact]
        public async Task GetViolationByIdAsync_BelongsToOtherUser_ThrowsNotFoundException()
        {
            // Arrange
            var violations = new List<Violation> { CreateViolation(10, userId: 1, "Test") };
            _violationRepoMock.Setup(r => r.GetViolationWithStallAsync(10, 999, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Violation?)null);

            // Act & Assert — user 999 trying to access user 1's violation
            await Assert.ThrowsAsync<NotFoundException>(
                () => _service.GetViolationByIdAsync(10, 999));
        }

        #endregion

        #region CreateViolationAsync

        [Fact]
        public async Task CreateViolationAsync_ValidRequest_ReturnsCreatedViolation()
        {
            // Arrange
            var userId = 1;
            var request = new CreateViolationRequest
            {
                StallId = 1,
                ViolationTypeId = 1,
                Title = "Vi phạm vệ sinh",
                Description = "Mô tả vi phạm",
                ImageUrl = "https://example.com/img.jpg",
                FineAmount = 500000
            };

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            var stalls = new List<Stall>
            {
                new() { StallId = 1, Code = "A-101", IsDeleted = false }
            };
            _stallRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Stall, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(stalls);

            var violationTypes = new List<ViolationType>
            {
                new() { ViolationTypeId = 1, Name = "Vệ sinh", DefaultFine = 500000, IsActive = true }
            };
            _violationTypeRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<ViolationType, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(violationTypes);

            _violationRepoMock.Setup(r => r.AddAsync(It.IsAny<Violation>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);
            _violationRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _service.CreateViolationAsync(userId, request);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be("Vi phạm vệ sinh");
            result.Status.Should().Be("Pending");
            result.StallCode.Should().Be("A-101");
            result.CreatedBy.Should().Be(userId);

            _violationRepoMock.Verify(r => r.AddAsync(It.IsAny<Violation>(), It.IsAny<CancellationToken>()), Times.Once);
            _violationRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateViolationAsync_InvalidRequest_ThrowsBadRequestException()
        {
            // Arrange
            var request = new CreateViolationRequest();

            var validationFailures = new List<ValidationFailure>
            {
                new("Title", "Tiêu đề vi phạm không được để trống.")
            };
            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult(validationFailures));

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(
                () => _service.CreateViolationAsync(1, request));
        }

        [Fact]
        public async Task CreateViolationAsync_StallNotFound_ThrowsNotFoundException()
        {
            // Arrange
            var request = new CreateViolationRequest
            {
                StallId = 999,
                Title = "Test",
                Description = "Test",
                ImageUrl = "https://example.com/img.jpg",
                FineAmount = 0
            };

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            var emptyStalls = new List<Stall>();
            _stallRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Stall, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(emptyStalls);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(
                () => _service.CreateViolationAsync(1, request));
        }

        [Fact]
        public async Task CreateViolationAsync_StallDeleted_ThrowsNotFoundException()
        {
            // Arrange
            var request = new CreateViolationRequest
            {
                StallId = 1,
                Title = "Test",
                Description = "Test",
                ImageUrl = "https://example.com/img.jpg",
                FineAmount = 0
            };

            _validatorMock.Setup(v => v.ValidateAsync(request, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            var deletedStalls = new List<Stall>
            {
                new() { StallId = 1, Code = "A-101", IsDeleted = true }
            };
            _stallRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Stall, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(deletedStalls);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(
                () => _service.CreateViolationAsync(1, request));
        }

        #endregion

        #region Helpers

        private static Violation CreateViolation(int id, int userId, string title, string status = "Pending")
        {
            return new Violation
            {
                ViolationId = id,
                StallId = 1,
                CreatedByUserId = userId,
                ViolationTypeId = 1,
                Title = title,
                Description = $"Description for {title}",
                ImageUrl = "https://example.com/img.jpg",
                FineAmount = 100000,
                Status = status,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                Stall = new Stall { StallId = 1, Code = "A-101" }
            };
        }

        #endregion
    }
}
