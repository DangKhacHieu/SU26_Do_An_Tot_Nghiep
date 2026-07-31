using System;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http;
using System.Net.Http.Json;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using Microsoft.Extensions.Caching.Memory;
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
        private readonly IValidator<STMM.Business.DTOs.Auth.ChangePasswordRequest> _changePasswordValidator;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly IMemoryCache _cache;

        public AuthService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IMapper mapper,
            IValidator<LoginRequest> loginValidator,
            IValidator<RegisterRequest> registerValidator,
            IValidator<STMM.Business.DTOs.Auth.ChangePasswordRequest> changePasswordValidator,
            IConfiguration configuration,
            IEmailService emailService,
            IMemoryCache cache)
        {
            _userRepository = userRepository;
            _roleRepository = roleRepository;
            _mapper = mapper;
            _loginValidator = loginValidator;
            _registerValidator = registerValidator;
            _changePasswordValidator = changePasswordValidator;
            _configuration = configuration;
            _emailService = emailService;
            _cache = cache;
        }

        public async Task<LoginResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
        {
            if (request == null)
            {
                throw new BadRequestException("Yêu cầu đăng nhập không được để trống");
            }

            var validationResult = await _loginValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var user = await _userRepository.GetUserByEmailAsync(request.Email, ct);
            if (user == null || user.IsDeleted == true)
            {
                throw new BadRequestException("Email hoặc mật khẩu không chính xác");
            }

            if (string.Equals(user.Status, "Inactive", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Tài khoản của bạn đang ngưng hoạt động (Inactive). Vui lòng liên hệ Ban Quản lý Chợ qua hotline 1900-8888 hoặc email support@stmm.com để được hỗ trợ.");
            }

            if (string.Equals(user.Status, "Unverified", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Tài khoản chưa được xác thực email. Vui lòng xác thực trước khi đăng nhập.");
            }

            if (string.Equals(user.Status, "Suspended", StringComparison.OrdinalIgnoreCase) || string.Equals(user.Status, "Locked", StringComparison.OrdinalIgnoreCase))
            {
                throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng. Vui lòng liên hệ Ban Quản lý Chợ để được hỗ trợ.");
            }

            // Verify password using BCrypt with plain-text fallback for local/seeded accounts
            bool isPasswordCorrect = false;
            if (user.Password == request.Password)
            {
                isPasswordCorrect = true;
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
                Status = user.Status ?? string.Empty,
                MarketId = user.MarketId
            };

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto,
                RedirectUrl = GetRedirectUrlByRole(roleName)
            };
        }

        public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
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

            var otpCode = Random.Shared.Next(100000, 999999).ToString();
            var now = DateTime.UtcNow;

            var pendingUser = new PendingUserDto
            {
                Name = request.Name,
                Email = request.Email,
                Password = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Phone = request.Phone,
                Cccd = request.Cccd,
                OtpCode = otpCode,
                OtpExpiredAt = now.AddMinutes(2)
            };

            // Store in memory cache for 2 minutes (absolute expiration)
            var cacheKey = $"pending-user:{pendingUser.Email}";
            _cache.Set(cacheKey, pendingUser, TimeSpan.FromMinutes(2));

            var emailBody = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"">
    <div style=""text-align: center; margin-bottom: 20px;"">
        <h2 style=""color: #2e7d32; margin: 0;"">Smart Market (STMM)</h2>
        <p style=""color: #666; font-size: 14px; margin: 5px 0 0 0;"">Hệ thống quản lý chợ thông minh</p>
    </div>
    <div style=""background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;"">
        <p style=""margin-top: 0;"">Xin chào <strong>{pendingUser.Name}</strong>,</p>
        <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>Smart Market</strong>. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực OTP dưới đây:</p>
        <div style=""text-align: center; margin: 30px 0;"">
            <span style=""font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d32; background-color: #e8f5e9; padding: 10px 20px; border-radius: 4px; border: 1px dashed #81c784;"">{otpCode}</span>
        </div>
        <p style=""color: #666; font-size: 12px; text-align: center;"">Mã này có hiệu lực trong vòng <strong>2 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
    </div>
    <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
    <p style=""color: #999; font-size: 11px; text-align: center; margin: 0;"">Đây là email tự động từ hệ thống STMM, vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendEmailAsync(pendingUser.Email, "Xác thực tài khoản Smart Market (STMM)", emailBody, ct);

            return new RegisterResponse
            {
                RequiresVerification = true,
                Email = pendingUser.Email,
                Message = "Tài khoản của bạn đã được đăng ký tạm thời. Vui lòng kiểm tra email để nhận mã OTP xác thực kích hoạt."
            };
        }

        public async Task<LoginResponse> VerifyEmailAsync(VerifyEmailRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var code = request.Code?.Trim() ?? string.Empty;

            var cacheKey = $"pending-user:{email}";
            if (!_cache.TryGetValue(cacheKey, out PendingUserDto? pendingUser) || pendingUser == null)
            {
                throw new BadRequestException("Mã xác thực đã hết hạn hoặc thông tin đăng ký không còn hiệu lực. Vui lòng đăng ký lại.");
            }

            if (pendingUser.OtpCode != code)
            {
                throw new BadRequestException("Mã xác thực không chính xác");
            }

            if (pendingUser.OtpExpiredAt < DateTime.UtcNow)
            {
                _cache.Remove(cacheKey);
                throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.");
            }

            // Check database again to prevent race condition/duplicate inserts
            var existingUser = await _userRepository.GetUserByEmailAsync(email, ct);
            if (existingUser != null)
            {
                _cache.Remove(cacheKey);
                throw new BadRequestException("Email đã được đăng ký và xác thực bởi tài khoản khác.");
            }

            var existingPhone = (await _userRepository.FindAsync(u => u.Phone == pendingUser.Phone, ct)).FirstOrDefault();
            if (existingPhone != null)
            {
                throw new BadRequestException("Số điện thoại đã được đăng ký bởi tài khoản khác.");
            }

            var existingCccd = (await _userRepository.FindAsync(u => u.Cccd == pendingUser.Cccd, ct)).FirstOrDefault();
            if (existingCccd != null)
            {
                throw new BadRequestException("CCCD đã được đăng ký bởi tài khoản khác.");
            }

            var customerRole = await GetOrCreateCustomerRoleAsync(ct);

            // Create and save user to DB only now!
            var now = DateTime.UtcNow;
            var user = new STMM.DataAccess.Entities.User
            {
                Name = pendingUser.Name,
                Email = pendingUser.Email,
                Password = pendingUser.Password, // Hashed password
                Phone = pendingUser.Phone,
                Cccd = pendingUser.Cccd,
                RoleId = customerRole.RoleId,
                Role = customerRole,
                Status = "Active",
                CreatedAt = now,
                UpdatedAt = now,
                IsDeleted = false
            };

            await _userRepository.AddAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);

            // Remove from cache
            _cache.Remove(cacheKey);

            // Auto-login upon successful verification
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
                Status = user.Status,
                MarketId = user.MarketId
            };

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto,
                RedirectUrl = GetRedirectUrlByRole(customerRole.Name)
            };
        }

        public async Task ResendVerificationCodeAsync(ResendVerificationRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;

            var cacheKey = $"pending-user:{email}";
            if (!_cache.TryGetValue(cacheKey, out PendingUserDto? pendingUser) || pendingUser == null)
            {
                throw new BadRequestException("Phiên đăng ký không tồn tại hoặc đã hết hạn. Vui lòng thực hiện đăng ký lại.");
            }

            var otpCode = Random.Shared.Next(100000, 999999).ToString();
            pendingUser.OtpCode = otpCode;
            pendingUser.OtpExpiredAt = DateTime.UtcNow.AddMinutes(2);

            // Reset in cache
            _cache.Set(cacheKey, pendingUser, TimeSpan.FromMinutes(2));

            var emailBody = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"">
    <div style=""text-align: center; margin-bottom: 20px;"">
        <h2 style=""color: #2e7d32; margin: 0;"">Smart Market (STMM)</h2>
        <p style=""color: #666; font-size: 14px; margin: 5px 0 0 0;"">Hệ thống quản lý chợ thông minh</p>
    </div>
    <div style=""background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;"">
        <p style=""margin-top: 0;"">Xin chào <strong>{pendingUser.Name}</strong>,</p>
        <p>Bạn đã yêu cầu gửi lại mã xác thực OTP cho tài khoản <strong>Smart Market</strong>. Mã xác thực mới của bạn là:</p>
        <div style=""text-align: center; margin: 30px 0;"">
            <span style=""font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d32; background-color: #e8f5e9; padding: 10px 20px; border-radius: 4px; border: 1px dashed #81c784;"">{otpCode}</span>
        </div>
        <p style=""color: #666; font-size: 12px; text-align: center;"">Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
    </div>
    <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
    <p style=""color: #999; font-size: 11px; text-align: center; margin: 0;"">Đây là email tự động từ hệ thống STMM, vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendEmailAsync(pendingUser.Email, "Gửi lại mã xác thực tài khoản Smart Market (STMM)", emailBody, ct);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var user = await _userRepository.GetUserByEmailAsync(email, ct);
            if (user == null)
            {
                throw new BadRequestException("Email không tồn tại trong hệ thống");
            }

            if (user.Status == "Suspended" || user.Status == "Locked")
            {
                throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng");
            }

            var otpCode = Random.Shared.Next(100000, 999999).ToString();
            user.OtpCode = otpCode;
            user.OtpExpiredAt = DateTime.UtcNow.AddMinutes(2);
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            var emailBody = $@"
<div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;"">
    <div style=""text-align: center; margin-bottom: 20px;"">
        <h2 style=""color: #2e7d32; margin: 0;"">Smart Market (STMM)</h2>
        <p style=""color: #666; font-size: 14px; margin: 5px 0 0 0;"">Hệ thống quản lý chợ thông minh</p>
    </div>
    <div style=""background-color: #f9f9f9; padding: 20px; border-radius: 6px; margin-bottom: 20px;"">
        <p style=""margin-top: 0;"">Xin chào <strong>{user.Name}</strong>,</p>
        <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản <strong>Smart Market</strong>. Mã xác thực OTP của bạn là:</p>
        <div style=""text-align: center; margin: 30px 0;"">
            <span style=""font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #2e7d32; background-color: #e8f5e9; padding: 10px 20px; border-radius: 4px; border: 1px dashed #81c784;"">{otpCode}</span>
        </div>
        <p style=""color: #666; font-size: 12px; text-align: center;"">Mã này có hiệu lực trong vòng <strong>2 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
    </div>
    <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
    <p style=""color: #999; font-size: 11px; text-align: center; margin: 0;"">Đây là email tự động từ hệ thống STMM, vui lòng không trả lời email này.</p>
</div>";

            await _emailService.SendEmailAsync(user.Email, "Yêu cầu khôi phục mật khẩu tài khoản Smart Market (STMM)", emailBody, ct);
        }

        public async Task VerifyResetOtpAsync(VerifyResetOtpRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var code = request.Code?.Trim() ?? string.Empty;

            var user = await _userRepository.GetUserByEmailAsync(email, ct);
            if (user == null)
            {
                throw new BadRequestException("Tài khoản không tồn tại");
            }

            if (user.Status == "Suspended" || user.Status == "Locked")
            {
                throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng");
            }

            if (user.OtpCode != code)
            {
                throw new BadRequestException("Mã xác thực không chính xác");
            }

            if (user.OtpExpiredAt < DateTime.UtcNow)
            {
                throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
            }
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
        {
            var email = request.Email?.Trim().ToLowerInvariant() ?? string.Empty;
            var code = request.Code?.Trim() ?? string.Empty;

            var user = await _userRepository.GetUserByEmailAsync(email, ct);
            if (user == null)
            {
                throw new BadRequestException("Tài khoản không tồn tại");
            }

            if (user.Status == "Suspended" || user.Status == "Locked")
            {
                throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng");
            }

            if (user.OtpCode != code)
            {
                throw new BadRequestException("Mã xác thực không chính xác");
            }

            if (user.OtpExpiredAt < DateTime.UtcNow)
            {
                throw new BadRequestException("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
            }

            // Reset password
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.OtpCode = null;
            user.OtpExpiredAt = null;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);
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
                    Status = user.Status ?? string.Empty,
                    MarketId = user.MarketId
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
                "admin" => "/admin/dashboard",
                "systemadmin" => "/admin/dashboard",
                "accountant" => "/accountant/dashboard",
                "customer" => "/",
                "vendor" => "/",
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

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? "Unknown")
            };

            if (user.MarketId.HasValue)
            {
                claims.Add(new Claim("MarketId", user.MarketId.Value.ToString()));
            }

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
                var trackedRole = await _roleRepository.GetByIdAsync(customerRole.RoleId, ct);
                if (trackedRole != null)
                {
                    return trackedRole;
                }
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

        public async Task<LoginResponse> LoginWithGoogleAsync(GoogleLoginRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.IdToken))
            {
                throw new BadRequestException("Token Google không hợp lệ");
            }

            GoogleTokenInfo? googleUser = null;
            using (var httpClient = new HttpClient())
            {
                try
                {
                    var response = await httpClient.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={request.IdToken}", ct);
                    if (!response.IsSuccessStatusCode)
                    {
                        throw new BadRequestException("Xác thực Token Google thất bại");
                    }

                    googleUser = await response.Content.ReadFromJsonAsync<GoogleTokenInfo>(cancellationToken: ct);
                }
                catch (Exception ex) when (!(ex is BadRequestException))
                {
                    throw new BadRequestException("Không thể kết nối tới Google Auth API");
                }
            }

            if (googleUser == null || string.IsNullOrWhiteSpace(googleUser.Email))
            {
                throw new BadRequestException("Xác thực Token Google thất bại hoặc email không hợp lệ");
            }

            var email = googleUser.Email.Trim().ToLowerInvariant();
            var user = await _userRepository.GetUserByEmailAsync(email, ct);

            STMM.DataAccess.Entities.Role customerRole;
            if (user == null)
            {
                // Register a new user
                customerRole = await GetOrCreateCustomerRoleAsync(ct);
                var now = DateTime.UtcNow;
                user = new STMM.DataAccess.Entities.User
                {
                    Name = googleUser.Name ?? googleUser.Email,
                    Email = email,
                    Password = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password since they login via Google
                    Phone = string.Empty,
                    Cccd = string.Empty,
                    RoleId = customerRole.RoleId,
                    Role = customerRole,
                    Status = "Active",
                    CreatedAt = now,
                    UpdatedAt = now,
                    IsDeleted = false
                };

                await _userRepository.AddAsync(user, ct);
                await _userRepository.SaveChangesAsync(ct);
            }
            else
            {
                if (string.Equals(user.Status, "Inactive", StringComparison.OrdinalIgnoreCase))
                {
                    throw new BadRequestException("Tài khoản của bạn đang ngưng hoạt động (Inactive). Vui lòng liên hệ Ban Quản lý Chợ qua hotline 1900-8888 hoặc email support@stmm.com để được hỗ trợ.");
                }

                if (string.Equals(user.Status, "Suspended", StringComparison.OrdinalIgnoreCase) || string.Equals(user.Status, "Locked", StringComparison.OrdinalIgnoreCase))
                {
                    throw new BadRequestException("Tài khoản đã bị khóa hoặc tạm dừng. Vui lòng liên hệ Ban Quản lý Chợ để được hỗ trợ.");
                }
                
                customerRole = user.Role ?? await GetOrCreateCustomerRoleAsync(ct);
            }

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken();
            var roleName = customerRole.Name;

            var userDto = new UserDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                RoleId = user.RoleId,
                RoleName = roleName,
                Status = user.Status ?? string.Empty,
                MarketId = user.MarketId
            };

            return new LoginResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                User = userDto,
                RedirectUrl = GetRedirectUrlByRole(roleName)
            };
        }

        public async Task ChangePasswordAsync(int userId, STMM.Business.DTOs.Auth.ChangePasswordRequest request, CancellationToken ct = default)
        {
            var validationResult = await _changePasswordValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null)
            {
                throw new NotFoundException("Tài khoản không tồn tại");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
            {
                throw new BadRequestException("Mật khẩu cũ không chính xác");
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);
        }

        private class GoogleTokenInfo
        {
            [System.Text.Json.Serialization.JsonPropertyName("email")]
            public string? Email { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("name")]
            public string? Name { get; set; }

            [System.Text.Json.Serialization.JsonPropertyName("picture")]
            public string? Picture { get; set; }
        }
    }
}
