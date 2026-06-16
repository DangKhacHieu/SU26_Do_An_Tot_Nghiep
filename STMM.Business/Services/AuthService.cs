using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Auth;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class AuthService : IAuthService
    {
        private readonly IUserRepository _userRepository;

        public AuthService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
        {
            if (request == null)
            {
                throw new BadRequestException("Yêu cầu đăng nhập không hợp lệ.");
            }

            if (string.IsNullOrWhiteSpace(request.Email))
            {
                throw new BadRequestException("Email không được để trống.");
            }

            if (string.IsNullOrWhiteSpace(request.Password))
            {
                throw new BadRequestException("Mật khẩu không được để trống.");
            }

            var emailNormalized = request.Email.Trim().ToLower();

            // Find user in database, including their role
            var user = await _userRepository.Query()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email.ToLower() == emailNormalized && u.IsDeleted != true, ct);

            if (user == null)
            {
                throw new BadRequestException("Tên đăng nhập hoặc mật khẩu không chính xác.");
            }

            // Verify password using BCrypt with plain-text fallback
            bool isPasswordCorrect = false;
            if (user.Password == request.Password)
            {
                isPasswordCorrect = true; // plain-text match
            }
            else
            {
                try
                {
                    isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.Password, user.Password);
                }
                catch
                {
                    isPasswordCorrect = false;
                }
            }

            if (!isPasswordCorrect)
            {
                throw new BadRequestException("Tên đăng nhập hoặc mật khẩu không chính xác.");
            }

            // Optional: Check status if required (e.g. status can be Active, Locked, etc.)
            if (user.Status != null && user.Status.Equals("Locked", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
            }

            // Update LastLogin timestamp
            user.LastLogin = DateTime.UtcNow;
            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return new AuthResponse
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                RoleId = user.RoleId,
                RoleName = user.Role?.Name ?? "Accountant",
                Token = $"dummy-jwt-token-{user.UserId}-{Guid.NewGuid()}"
            };
        }
    }
}
