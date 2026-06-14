using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using STMM.Business.DTOs.StallTask;
using STMM.Business.Mappers;
using STMM.Business.Services;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace STMM.Tests.Services
{
    public class StallTaskServiceTests
    {
        private readonly Mock<IStallRepository> _stallRepoMock;
        private readonly IMapper _mapper;
        private readonly StallTaskService _service;

        public StallTaskServiceTests()
        {
            _stallRepoMock = new Mock<IStallRepository>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            }, NullLoggerFactory.Instance);
            _mapper = mapperConfig.CreateMapper();

            _service = new StallTaskService(_stallRepoMock.Object, _mapper);
        }

        [Fact]
        public async Task GetStallTasksAsync_FilterAll_ReturnsStallsWithTasksOrUnpaidInvoices()
        {
            // Arrange
            var staffUserId = 1;
            var stalls = CreateMockStallResults(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "All", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<StallTaskSummaryQueryResult> { stalls[0], stalls[1] }, 2));

            var queryParams = new StallTaskQueryParams { Filter = "All" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(2);
            result.Items.Select(i => i.StallCode).Should().Contain(new[] { "A-1", "A-2" });
            result.Items.Select(i => i.StallCode).Should().NotContain("A-3");
        }

        [Fact]
        public async Task GetStallTasksAsync_FilterHasUnpaidInvoice_ReturnsOnlyStallsWithUnpaidInvoices()
        {
            // Arrange
            var staffUserId = 1;
            var stalls = CreateMockStallResults(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "HasUnpaidInvoice", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<StallTaskSummaryQueryResult> { stalls[0] }, 1));

            var queryParams = new StallTaskQueryParams { Filter = "HasUnpaidInvoice" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.Items.First().StallCode.Should().Be("A-1");
        }

        [Fact]
        public async Task GetStallTasksAsync_FilterHasTask_ReturnsOnlyStallsWithAssignedTasks()
        {
            // Arrange
            var staffUserId = 1;
            var stalls = CreateMockStallResults(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "HasTask", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<StallTaskSummaryQueryResult> { stalls[1] }, 1));

            var queryParams = new StallTaskQueryParams { Filter = "HasTask" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.Items.First().StallCode.Should().Be("A-2");
        }

        [Fact]
        public async Task GetStallTasksAsync_Search_ReturnsMatchingStall()
        {
            // Arrange
            var staffUserId = 1;
            var stalls = CreateMockStallResults(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, "A-2", "All", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<StallTaskSummaryQueryResult> { stalls[1] }, 1));

            var queryParams = new StallTaskQueryParams { Search = "A-2", Filter = "All" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.Items.First().StallCode.Should().Be("A-2");
        }

        private static List<StallTaskSummaryQueryResult> CreateMockStallResults(int staffUserId)
        {
            // Stall 1: Unpaid invoice, no staff task
            var result1 = new StallTaskSummaryQueryResult(
                StallId: 1,
                StallCode: "A-1",
                StallCategory: "Fruit",
                StallStatus: "Rented",
                VendorName: "Vendor Business",
                VendorPhone: "12345",
                HasUnpaidInvoice: true,
                UnpaidInvoiceCount: 1,
                UnpaidTotalAmount: 500000m,
                PendingTaskCount: 0,
                PendingTaskTypes: new List<string>()
            );

            // Stall 2: No unpaid invoice, has pending staff task via issue
            var result2 = new StallTaskSummaryQueryResult(
                StallId: 2,
                StallCode: "A-2",
                StallCategory: "Dry Goods",
                StallStatus: "Rented",
                VendorName: "Vendor Business",
                VendorPhone: "12345",
                HasUnpaidInvoice: false,
                UnpaidInvoiceCount: 0,
                UnpaidTotalAmount: 0m,
                PendingTaskCount: 1,
                PendingTaskTypes: new List<string> { "Repair" }
            );

            // Stall 3: Rented, but clean (no unpaid, no tasks)
            var result3 = new StallTaskSummaryQueryResult(
                StallId: 3,
                StallCode: "A-3",
                StallCategory: "Meat",
                StallStatus: "Rented",
                VendorName: "Vendor Business",
                VendorPhone: "12345",
                HasUnpaidInvoice: false,
                UnpaidInvoiceCount: 0,
                UnpaidTotalAmount: 0m,
                PendingTaskCount: 0,
                PendingTaskTypes: new List<string>()
            );

            return new List<StallTaskSummaryQueryResult> { result1, result2, result3 };
        }
    }
}
