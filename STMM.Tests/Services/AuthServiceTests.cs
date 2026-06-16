using FluentAssertions;
using Moq;
using STMM.Business.DTOs.Auth;
using STMM.Business.Exceptions;
using STMM.Business.Services;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using STMM.Business.Validators;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Caching.Memory;
using AutoMapper;
using STMM.Business.Interfaces;
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
        private readonly Mock<IRoleRepository> _roleRepoMock;
        private readonly Mock<IMapper> _mapperMock;
        private readonly Mock<IConfiguration> _configMock;
        private readonly Mock<IEmailService> _emailServiceMock;
        private readonly Mock<IMemoryCache> _cacheMock;
        private readonly AuthService _service;

        public AuthServiceTests()
        {
            _userRepoMock = new Mock<IUserRepository>();
            _roleRepoMock = new Mock<IRoleRepository>();
            _mapperMock = new Mock<IMapper>();
            _emailServiceMock = new Mock<IEmailService>();
            _cacheMock = new Mock<IMemoryCache>();

            // Mock configuration for JWT settings
            _configMock = new Mock<IConfiguration>();
            var jwtSectionMock = new Mock<IConfigurationSection>();
            jwtSectionMock.Setup(s => s["Key"]).Returns("SuperSecretKeyWithAtLeast32CharactersForHMACSHA256!");
            jwtSectionMock.Setup(s => s["Issuer"]).Returns("STMM");
            jwtSectionMock.Setup(s => s["Audience"]).Returns("STMM");
            _configMock.Setup(c => c.GetSection("Jwt")).Returns(jwtSectionMock.Object);

            var loginValidator = new LoginValidator();
            var registerValidator = new RegisterValidator();

            _service = new AuthService(
                _userRepoMock.Object,
                _roleRepoMock.Object,
                _mapperMock.Object,
                loginValidator,
                registerValidator,
                _configMock.Object,
                _emailServiceMock.Object,
                _cacheMock.Object
            );
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
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("notfound@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync((User?)null);

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Email hoặc mật khẩu không chính xác");
        }

        [Fact]
        public async Task LoginAsync_UserDeleted_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "deleted@stmm.vn", Password = "password" };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("deleted@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User
                {
                    Email = "deleted@stmm.vn",
                    Password = "password",
                    IsDeleted = true
                });

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Email hoặc mật khẩu không chính xác");
        }

        [Fact]
        public async Task LoginAsync_UserLocked_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "locked@stmm.vn", Password = "password" };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("locked@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User
                {
                    Email = "locked@stmm.vn",
                    Password = "password",
                    Status = "Locked"
                });

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Tài khoản đã bị khóa hoặc tạm dừng");
        }

        [Fact]
        public async Task LoginAsync_WrongPassword_ThrowsBadRequestException()
        {
            // Arrange
            var request = new LoginRequest { Email = "test@stmm.vn", Password = "wrongpassword" };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("test@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User
                {
                    Email = "test@stmm.vn",
                    Password = BCrypt.Net.BCrypt.HashPassword("correctpassword")
                });

            // Act & Assert
            var exception = await Assert.ThrowsAsync<BadRequestException>(() => _service.LoginAsync(request));
            exception.Message.Should().Be("Email hoặc mật khẩu không chính xác");
        }

        [Fact]
        public async Task LoginAsync_CorrectPasswordPlaintext_ReturnsAuthResponse()
        {
            // Arrange
            var request = new LoginRequest { Email = "plain@stmm.vn", Password = "plainpassword" };
            var role = new Role { RoleId = 3, Name = "Accountant" };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("plain@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User
                {
                    UserId = 10,
                    Name = "Le Binh",
                    Email = "plain@stmm.vn",
                    Password = "plainpassword",
                    RoleId = 3,
                    Role = role
                });

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.User.Should().NotBeNull();
            result.User.UserId.Should().Be(10);
            result.User.Name.Should().Be("Le Binh");
            result.User.Email.Should().Be("plain@stmm.vn");
            result.User.RoleId.Should().Be(3);
            result.User.RoleName.Should().Be("Accountant");
            result.AccessToken.Should().NotBeNullOrEmpty();
        }

        [Fact]
        public async Task LoginAsync_CorrectPasswordBCrypt_ReturnsAuthResponse()
        {
            // Arrange
            var request = new LoginRequest { Email = "bcrypt@stmm.vn", Password = "bcryptpassword" };
            var role = new Role { RoleId = 2, Name = "Manager" };
            _userRepoMock.Setup(r => r.GetUserByEmailAsync("bcrypt@stmm.vn", It.IsAny<CancellationToken>()))
                .ReturnsAsync(new User
                {
                    UserId = 12,
                    Name = "Manager User",
                    Email = "bcrypt@stmm.vn",
                    Password = BCrypt.Net.BCrypt.HashPassword("bcryptpassword"),
                    RoleId = 2,
                    Role = role
                });

            // Act
            var result = await _service.LoginAsync(request);

            // Assert
            result.Should().NotBeNull();
            result.User.Should().NotBeNull();
            result.User.UserId.Should().Be(12);
            result.User.Name.Should().Be("Manager User");
            result.User.Email.Should().Be("bcrypt@stmm.vn");
            result.User.RoleId.Should().Be(2);
            result.User.RoleName.Should().Be("Manager");
            result.AccessToken.Should().NotBeNullOrEmpty();
        }
    }
}
