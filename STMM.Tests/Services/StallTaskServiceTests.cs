using AutoMapper;
using FluentAssertions;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using STMM.Business.DTOs.StallTask;
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
            var stalls = CreateMockStalls(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "All", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Stall> { stalls[0], stalls[1] }, 2));

            var queryParams = new StallTaskQueryParams { Filter = "All" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(2); // Stall A-1 (has unpaid invoice), Stall A-2 (has assigned task), Stall A-3 (none)
            result.Items.Select(i => i.StallCode).Should().Contain(new[] { "A-1", "A-2" });
            result.Items.Select(i => i.StallCode).Should().NotContain("A-3");
        }

        [Fact]
        public async Task GetStallTasksAsync_FilterHasUnpaidInvoice_ReturnsOnlyStallsWithUnpaidInvoices()
        {
            // Arrange
            var staffUserId = 1;
            var stalls = CreateMockStalls(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "HasUnpaidInvoice", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Stall> { stalls[0] }, 1));

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
            var stalls = CreateMockStalls(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, It.IsAny<string>(), "HasTask", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Stall> { stalls[1] }, 1));

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
            var stalls = CreateMockStalls(staffUserId);

            _stallRepoMock.Setup(r => r.GetStallTasksPagedAsync(staffUserId, "A-2", "All", It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Stall> { stalls[1] }, 1));

            var queryParams = new StallTaskQueryParams { Search = "A-2", Filter = "All" };

            // Act
            var result = await _service.GetStallTasksAsync(staffUserId, queryParams);

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(1);
            result.Items.First().StallCode.Should().Be("A-2");
        }

        private static List<Stall> CreateMockStalls(int staffUserId)
        {
            var user = new User { UserId = 5, Phone = "12345", Name = "Vendor Name" };
            var vendor = new Vendor { VendorId = 2, UserId = 5, BusinessName = "Vendor Business", User = user };

            // Stall 1: Unpaid invoice, no staff task
            var stall1 = new Stall { StallId = 1, Code = "A-1", Category = new BusinessCategory { Name = "Fruit", Code = "FRUIT" }, Status = "Rented", IsDeleted = false };
            var contract1 = new Contract { ContractId = 10, StallId = 1, VendorId = 2, Vendor = vendor, Status = "Active", IsDeleted = false };
            contract1.Invoices.Add(new Invoice { InvoiceId = 100, ContractId = 10, Status = "Unpaid", TotalAmount = 500000, IsDeleted = false });
            stall1.Contracts.Add(contract1);

            // Stall 2: No unpaid invoice, has pending staff task via issue
            var stall2 = new Stall { StallId = 2, Code = "A-2", Category = new BusinessCategory { Name = "Dry Goods", Code = "DRY" }, Status = "Rented", IsDeleted = false };
            var issue2 = new Issue { IssueId = 20, StallId = 2, Title = "Broken bulb", Status = "InProgress" };
            issue2.StaffTasks.Add(new StaffTask { TaskId = 200, IssueId = 20, AssignedToUserId = staffUserId, Status = "InProgress", TaskType = "Repair" });
            stall2.Issues.Add(issue2);

            // Stall 3: Rented, but clean (no unpaid, no tasks)
            var stall3 = new Stall { StallId = 3, Code = "A-3", Category = new BusinessCategory { Name = "Meat", Code = "MEAT" }, Status = "Rented", IsDeleted = false };

            return new List<Stall> { stall1, stall2, stall3 };
        }
    }
}
