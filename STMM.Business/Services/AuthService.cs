using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class AuthService : IAuthService
    {
        private const string DefaultCustomerRoleName = "Customer";

        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<LoginRequest> _loginValidator;
        private readonly IValidator<RegisterRequest> _registerValidator;
        private readonly IConfiguration _configuration;

        public AuthService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IMapper mapper,
            IValidator<LoginRequest> loginValidator,
            IValidator<RegisterRequest> registerValidator,
            IConfiguration configuration)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _mapper = mapper;
            _loginValidator = loginValidator;
            _registerValidator = registerValidator;
            _configuration = configuration;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
        {
            var validationResult = await _loginValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var user = await _userRepository.GetUserByEmailAsync(request.Email, ct);
            if (user == null)
            {
                throw new BadRequestException("Email hoặc mật khẩu không chính xác");
            }

            if (user.Status == "Suspended" || user.Status == "Locked")
            {
                throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.Password, user.Password))
            {
                throw new BadRequestException("Email hoặc mật khẩu không chính xác");
            }

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            var roleName = user.Role?.Name ?? "Unknown";

            var userDto = new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                RoleName = roleName,
                Status = user.Status
            };

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto,
                RedirectUrl = GetRedirectUrlByRole(roleName)
            };
        }

        public async Task<LoginResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
        {
            request.Name = request.Name?.Trim() ?? string.Empty;
            request.Email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            request.Phone = request.Phone?.Trim() ?? string.Empty;
            request.Cccd = request.Cccd?.Trim() ?? string.Empty;

            var validationResult = await _registerValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var existingUser = await _userRepository.GetUserByEmailAsync(request.Email, ct);
            if (existingUser != null)
            {
                throw new BadRequestException("Email đã được sử dụng");
            }

            var existingPhone = (await _userRepository.FindAsync(u => u.Phone == request.Phone, ct)).FirstOrDefault();
            if (existingPhone != null)
            {
                throw new BadRequestException("Số điện thoại đã được sử dụng");
            }

            var existingCccd = (await _userRepository.FindAsync(u => u.Cccd == request.Cccd, ct)).FirstOrDefault();
            if (existingCccd != null)
            {
                throw new BadRequestException("CCCD đã được sử dụng");
            }

            var customerRole = await GetOrCreateCustomerRoleAsync(ct);

            var now = DateTime.UtcNow;
            var user = new STMM.DataAccess.Entities.User
            {
                Name = request.Name,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Phone = request.Phone,
                Cccd = request.Cccd,
                RoleId = customerRole.RoleId,
                Role = customerRole,
                Status = "Active",
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            await _userRepository.AddAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();

            var userDto = new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                RoleName = customerRole.Name,
                Status = user.Status
            };

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto,
                RedirectUrl = GetRedirectUrlByRole(customerRole.Name)
            };
        }

        public async Task<LoginResponse> RefreshTokenAsync(RefreshTokenRequest request, CancellationToken ct = default)
        {
            try
            {
                var principal = GetPrincipalFromExpiredToken(request.AccessToken);
                var userIdClaim = principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

                if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
                {
                    throw new BadRequestException("Token không hợp lệ");
                }

                var user = await _userRepository.GetByIdAsync(userId, ct);
                if (user == null || user.Status == "Suspended" || user.Status == "Locked")
                {
                    throw new BadRequestException("Tài khoản không hợp lệ");
                }

                var newAccessToken = GenerateAccessToken(user);
                var newRefreshToken = GenerateRefreshToken();

                var roleName = user.Role?.Name ?? "Unknown";

                var userDto = new UserDto
                {
                    UserId = user.UserId,
                    Name = user.Name,
                    Email = user.Email,
                    Phone = user.Phone,
                    RoleId = user.RoleId,
                    RoleName = roleName,
                    Status = user.Status
                };

                return new LoginResponse
                {
                    AccessToken = newAccessToken,
                    RefreshToken = newRefreshToken,
                    User = userDto,
                    RedirectUrl = GetRedirectUrlByRole(roleName)
                };
            }
            catch (Exception)
            {
                throw new BadRequestException("Refresh token không hợp lệ");
            }
        }

        private string GetRedirectUrlByRole(string? roleName)
        {
            var role = roleName?.Trim().ToLowerInvariant();

            return role switch
            {
                "systemadmin" => "/admin/dashboard",
                "customer" => "/",
                "vendor" => "/vendor/dashboard",
                "staff" => "/staff/dashboard",
                "manager" => "/manager/dashboard",
                _ => "/"
            };
        }

        private string GenerateAccessToken(STMM.DataAccess.Entities.User user)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Unknown")
            };

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(15),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken()
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private async Task<STMM.DataAccess.Entities.Role> GetOrCreateCustomerRoleAsync(CancellationToken ct)
        {
            var customerRole = (await _roleRepository.FindAsync(
                r => r.Name.ToLower() == DefaultCustomerRoleName.ToLower(),
                ct)).FirstOrDefault();

            if (customerRole != null)
            {
                return customerRole;
            }

            customerRole = new STMM.DataAccess.Entities.Role
            {
                Name = DefaultCustomerRoleName,
                Description = "Khách hàng đăng ký từ website"
            };

            await _roleRepository.AddAsync(customerRole, ct);
            await _roleRepository.SaveChangesAsync(ct);

            return customerRole;
        }

        private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
        {
            var jwtSettings = _configuration.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = jwtSettings["Issuer"],
                ValidateAudience = true,
                ValidAudience = jwtSettings["Audience"],
                ValidateLifetime = false
            }, out SecurityToken securityToken);

            if (!(securityToken is JwtSecurityToken jwtSecurityToken) ||
                !jwtSecurityToken.Header.Alg.Equals(
                    SecurityAlgorithms.HmacSha256,
                    StringComparison.InvariantCultureIgnoreCase))
            {
                return null;
            }

            return principal;
        }
    }
}