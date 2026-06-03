using AutoMapper;
using FluentAssertions;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using STMM.Business.DTOs.Issue;
using STMM.Business.Exceptions;
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
    public class IssueServiceTests
    {
        private readonly Mock<IIssueRepository> _issueRepoMock;
        private readonly Mock<IStallRepository> _stallRepoMock;
        private readonly Mock<IStaffTaskRepository> _staffTaskRepoMock;
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly Mock<IValidator<CreateIssueRequest>> _createValidatorMock;
        private readonly Mock<IValidator<UpdateIssueStatusRequest>> _updateStatusValidatorMock;
        private readonly IMapper _mapper;
        private readonly IssueService _service;

        public IssueServiceTests()
        {
            _issueRepoMock = new Mock<IIssueRepository>();
            _stallRepoMock = new Mock<IStallRepository>();
            _staffTaskRepoMock = new Mock<IStaffTaskRepository>();
            _userRepoMock = new Mock<IUserRepository>();

            _createValidatorMock = new Mock<IValidator<CreateIssueRequest>>();
            _updateStatusValidatorMock = new Mock<IValidator<UpdateIssueStatusRequest>>();

            var mapperConfig = new MapperConfiguration(cfg =>
            {
                cfg.AddProfile<MappingProfile>();
            }, NullLoggerFactory.Instance);
            _mapper = mapperConfig.CreateMapper();

            _service = new IssueService(
                _issueRepoMock.Object,
                _staffTaskRepoMock.Object,
                _stallRepoMock.Object,
                _userRepoMock.Object,
                _mapper,
                _createValidatorMock.Object,
                _updateStatusValidatorMock.Object);
        }

        [Fact]
        public async Task GetIssuesAsync_AssignedToOrCreatedByMe_ReturnsIssues()
        {
            // Arrange
            var staffUserId = 1;
            var issues = new List<Issue>
            {
                new() { IssueId = 1, CreatedByUserId = staffUserId, Title = "My Created Issue", Stall = new Stall { Code = "A-1" } },
                new() { IssueId = 2, CreatedByUserId = 99, Title = "Assigned To Me Issue", Stall = new Stall { Code = "A-2" } },
                new() { IssueId = 3, CreatedByUserId = 99, Title = "Other Issue", Stall = new Stall { Code = "A-3" } }
            };

            var staffTasks = new List<StaffTask>
            {
                new() { TaskId = 10, IssueId = 2, AssignedToUserId = staffUserId, Title = "Fix Issue 2" }
            };

            _staffTaskRepoMock.Setup(r => r.GetAssignedIssueIdsAsync(staffUserId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<int> { 2 });

            _issueRepoMock.Setup(r => r.GetIssuesPagedAsync(staffUserId, It.IsAny<List<int>>(), It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((new List<Issue> { issues[0], issues[1] }, 2));

            // Act
            var result = await _service.GetIssuesAsync(staffUserId, new IssueQueryParams());

            // Assert
            result.Should().NotBeNull();
            result.TotalCount.Should().Be(2); // issue 1 (created) & issue 2 (assigned task)
            result.Items.Select(i => i.IssueId).Should().Contain(new[] { 1, 2 });
            result.Items.Select(i => i.IssueId).Should().NotContain(3);
        }

        [Fact]
        public async Task GetIssueByIdAsync_NotFoundOrUnauthorized_ThrowsNotFoundException()
        {
            // Arrange
            var staffUserId = 1;
            _issueRepoMock.Setup(r => r.IsCreatorAsync(999, staffUserId, It.IsAny<CancellationToken>())).ReturnsAsync(false);
            _staffTaskRepoMock.Setup(r => r.HasAssignedTaskAsync(999, staffUserId, It.IsAny<CancellationToken>())).ReturnsAsync(false);

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _service.GetIssueByIdAsync(999, staffUserId));
        }

        [Fact]
        public async Task CreateIssueAsync_ValidRequest_CreatesIssue()
        {
            // Arrange
            var staffUserId = 1;
            var req = new CreateIssueRequest { StallId = 1, Title = "Electricity issue", Description = "Socket broken" };
            var stall = new Stall { StallId = 1, Code = "A-101", IsDeleted = false };
            var user = new User { UserId = staffUserId, Name = "Staff User" };

            _createValidatorMock.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _stallRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Stall, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<Stall> { stall });

            _userRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<User, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<User> { user });

            _issueRepoMock.Setup(r => r.AddAsync(It.IsAny<Issue>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            var result = await _service.CreateIssueAsync(staffUserId, req);

            // Assert
            result.Should().NotBeNull();
            result.Title.Should().Be(req.Title);
            result.Status.Should().Be("Reported");
            result.StallCode.Should().Be("A-101");
            result.CreatedByName.Should().Be("Staff User");

            _issueRepoMock.Verify(r => r.AddAsync(It.Is<Issue>(i =>
                i.StallId == req.StallId &&
                i.Title == req.Title &&
                i.Description == req.Description &&
                i.Status == "Reported"
            ), It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_NotAssignedToTask_ThrowsNotFoundException()
        {
            // Arrange
            var staffUserId = 1;
            var issueId = 5;
            var req = new UpdateIssueStatusRequest { NewStatus = "InProgress" };

            _updateStatusValidatorMock.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            // Staff task is not assigned to staffUserId 1 for issueId 5
            _staffTaskRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<StaffTask, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<StaffTask>());

            // Act & Assert
            await Assert.ThrowsAsync<NotFoundException>(() => _service.UpdateIssueStatusAsync(staffUserId, issueId, req));
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_InvalidTransition_ThrowsBadRequestException()
        {
            // Arrange
            var staffUserId = 1;
            var issueId = 5;
            var req = new UpdateIssueStatusRequest { NewStatus = "Resolved" }; // Reported to Resolved is invalid (must go to InProgress first)
            
            var issue = new Issue { IssueId = issueId, Status = "Reported", Stall = new Stall { Code = "A-1" } };
            var task = new StaffTask { TaskId = 10, IssueId = issueId, AssignedToUserId = staffUserId, Status = "Pending" };

            _updateStatusValidatorMock.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _staffTaskRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<StaffTask, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<StaffTask> { task });

            _issueRepoMock.Setup(r => r.GetIssueWithRelationsAsync(issueId, true, It.IsAny<CancellationToken>()))
                .ReturnsAsync(issue);

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.UpdateIssueStatusAsync(staffUserId, issueId, req));
        }

        [Fact]
        public async Task UpdateIssueStatusAsync_ResolvedTransition_AutoCompletesStaffTask()
        {
            // Arrange
            var staffUserId = 1;
            var issueId = 5;
            var req = new UpdateIssueStatusRequest { NewStatus = "Resolved" };
            
            var issue = new Issue { IssueId = issueId, Status = "InProgress", Stall = new Stall { Code = "A-1" } };
            var task = new StaffTask { TaskId = 10, IssueId = issueId, AssignedToUserId = staffUserId, Status = "InProgress" };

            _updateStatusValidatorMock.Setup(v => v.ValidateAsync(req, It.IsAny<CancellationToken>()))
                .ReturnsAsync(new ValidationResult());

            _staffTaskRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<StaffTask, bool>>>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(new List<StaffTask> { task });

            _issueRepoMock.Setup(r => r.GetIssueWithRelationsAsync(issueId, true, It.IsAny<CancellationToken>()))
                .ReturnsAsync(issue);

            _issueRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            // Act
            var result = await _service.UpdateIssueStatusAsync(staffUserId, issueId, req);

            // Assert
            result.Should().NotBeNull();
            result.Status.Should().Be("Resolved");
            
            task.Status.Should().Be("Completed");
            task.CompletedAt.Should().NotBeNull();

            _issueRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
