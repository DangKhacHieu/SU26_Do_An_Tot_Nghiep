using FluentAssertions;
using Moq;
using STMM.Business.DTOs.Auth;
using STMM.Business.Exceptions;
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
    public class AuthServiceTests
    {
        private readonly Mock<IUserRepository> _userRepoMock;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _service = new AuthService(_userRepoMock.Object);
        }

        [Fact]
        public async Task LoginAsync_NullRequest_ThrowsBadRequestException()
        {
            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(null!));
        }

        [Theory]
        [InlineData("", "password")]
        [InlineData("   ", "password")]
        [InlineData(null, "password")]
        [InlineData("email@stmm.vn", "")]
        [InlineData("email@stmm.vn", "   ")]
        [InlineData("email@stmm.vn", null)]
        public async Task LoginAsync_InvalidRequestFields_ThrowsBadRequestException(string? email, string? password)
        {
            // Arrange
            var request = new LoginRequest { Email = email!, Password = password! };

            // Act & Assert
            await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
        }

        [Fact]
        public async Task LoginAsync_UserNotFound_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "notfound@stmm.vn", Password = "password" };
            var usersList = new List<User>().AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        [Fact]
        public async Task LoginAsync_UserDeleted_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "deleted@stmm.vn", Password = "password" };
            var usersList = new List<User>
            {
                new User
                {
                    Email = "deleted@stmm.vn",
                    Password = "password",
                    IsDeleted = true
                }
            }.AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        [Fact]
        public async Task LoginAsync_UserLocked_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "locked@stmm.vn", Password = "password" };
            var usersList = new List<User>
            {
                new User
                {
                    Email = "locked@stmm.vn",
                    Password = "password",
                    Status = "Locked"
                }
            }.AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        [Fact]
        public async Task LoginAsync_WrongPassword_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "test@stmm.vn", Password = "wrongpassword" };
            var usersList = new List<User>
            {
                new User
                {
                    Email = "test@stmm.vn",
                    Password = BCrypt.Net.BCrypt.HashPassword("correctpassword")
                }
            }.AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Tên đăng nhập hoặc mật khẩu không chính xác.");
        }

        [Fact]
        public async Task LoginAsync_CorrectPasswordPlaintext_ReturnsAuthResponse()
        {
            // Arrange
            var request = new LoginRequest { Email = "plain@stmm.vn", Password = "plainpassword" };
            var role = new Role { RoleId = 3, Name = "Accountant" };
            var usersList = new List<User>
            {
                new User
                {
                    UserId = 10,
                    Name = "Le Binh",
                    Email = "plain@stmm.vn",
                    Password = "plainpassword",
                    RoleId = 3,
                    Role = role
                }
            }.AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);
            _userRepoMock.Setup(r => r.Update(It.IsAny<User>()));
            _userRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(10);
            result.Name.Should().Be("Le Binh");
            result.Email.Should().Be("plain@stmm.vn");
            result.RoleId.Should().Be(3);
            result.RoleName.Should().Be("Accountant");
            result.Token.Should().StartWith("dummy-jwt-token-");

            _userRepoMock.Verify(r => r.Update(It.Is<User>(u => u.UserId == 10 && u.LastLogin != null)), Times.Once);
            _userRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }

        [Fact]
        public async Task LoginAsync_CorrectPasswordBCrypt_ReturnsAuthResponse()
        {
            // Arrange
            var request = new LoginRequest { Email = "bcrypt@stmm.vn", Password = "bcryptpassword" };
            var role = new Role { RoleId = 2, Name = "Manager" };
            var usersList = new List<User>
            {
                new User
                {
                    UserId = 12,
                    Name = "Manager User",
                    Email = "bcrypt@stmm.vn",
                    Password = BCrypt.Net.BCrypt.HashPassword("bcryptpassword"),
                    RoleId = 2,
                    Role = role
                }
            }.AsQueryable().ToAsyncQueryable();
            _userRepoMock.Setup(r => r.Query()).Returns(usersList);
            _userRepoMock.Setup(r => r.Update(It.IsAny<User>()));
            _userRepoMock.Setup(r => r.SaveChangesAsync(It.IsAny<CancellationToken>())).ReturnsAsync(1);

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.UserId.Should().Be(12);
            result.Name.Should().Be("Manager User");
            result.Email.Should().Be("bcrypt@stmm.vn");
            result.RoleId.Should().Be(2);
            result.RoleName.Should().Be("Manager");
            result.Token.Should().StartWith("dummy-jwt-token-");

            _userRepoMock.Verify(r => r.Update(It.Is<User>(u => u.UserId == 12 && u.LastLogin != null)), Times.Once);
            _userRepoMock.Verify(r => r.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}
