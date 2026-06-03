using FluentAssertions;
using Moq;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Services;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Threading;
using System.Threading.Tasks;
using Xunit;

namespace STMM.Tests.Services
{
    public class NotificationServiceTests
    {
        private readonly Mock<INotificationRepository> _notificationRepoMock;
        private readonly NotificationService _service;

        public NotificationServiceTests()
        {
            _notificationRepoMock = new Mock<INotificationRepository>();
            _service = new NotificationService(_notificationRepoMock.Object);
        }

        [Fact]
        public async Task CreateAsync_ValidRequest_TargetUser_SavesNotification()
        {
            // Arrange
            var req = new CreateNotificationRequest
            {
                Title = "Test User",
                Content = "Content User",
                NotiType = "Invoice",
                CreatedByUserId = 1,
                TargetUserId = 2,
                TargetRole = null
            };

            _notificationRepoMock.Setup(r => r.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.CreateAsync(req);

            // Assert
            _notificationRepoMock.Verify(r => r.AddAsync(It.Is<Notification>(n =>
                n.Title == req.Title &&
                n.Content == req.Content &&
                n.NotiType == req.NotiType &&
                n.CreatedByUserId == req.CreatedByUserId &&
                n.TargetUserId == req.TargetUserId &&
                n.TargetRole == null &&
                n.IsRead == false
            ), It.IsAny<CancellationToken>()), Times.Once);

            _notificationRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_ValidRequest_TargetRole_SavesNotification()
        {
            // Arrange
            var req = new CreateNotificationRequest
            {
                Title = "Test Role",
                Content = "Content Role",
                NotiType = "Violation",
                CreatedByUserId = 1,
                TargetUserId = null,
                TargetRole = "Manager"
            };

            _notificationRepoMock.Setup(r => r.AddAsync(It.IsAny<Notification>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            // Act
            await _service.CreateAsync(req);

            // Assert
            _notificationRepoMock.Verify(r => r.AddAsync(It.Is<Notification>(n =>
                n.Title == req.Title &&
                n.Content == req.Content &&
                n.NotiType == req.NotiType &&
                n.CreatedByUserId == req.CreatedByUserId &&
                n.TargetUserId == null &&
                n.TargetRole == req.TargetRole &&
                n.IsRead == false
            ), It.IsAny<CancellationToken>()), Times.Once);

            _notificationRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task CreateAsync_BothTargetUserAndRole_ThrowsBadRequestException()
        {
            // Arrange
            var req = new CreateNotificationRequest
            {
                Title = "Test Invalid",
                Content = "Content",
                CreatedByUserId = 1,
                TargetUserId = 2,
                TargetRole = "Manager"
            };

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAsync(req));
        }

        [Fact]
        public async Task CreateAsync_NeitherTargetUserNorRole_ThrowsBadRequestException()
        {
            // Arrange
            var req = new CreateNotificationRequest
            {
                Title = "Test Invalid",
                Content = "Content",
                CreatedByUserId = 1,
                TargetUserId = null,
                TargetRole = null
            };

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.CreateAsync(req));
        }
    }
}
