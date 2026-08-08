
using STMM.Business.DTOs.Profile;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class UserProfileService : IUserProfileService
    {
        private readonly IUserRepository _userRepository;

        public UserProfileService(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);

            if (user == null)
            {
                // Fallback: Find the first Accountant in the database
                user = await _userRepository.GetFirstUserByRoleAsync("Accountant", ct);
            }

            if (user == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_TAI_KHOAN_NGUOI_DUNG_ID_USERID|{userId}");
            }

            return MapToProfileDto(user);
        }

        public async Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);

            if (user == null)
            {
                user = await _userRepository.GetFirstUserByRoleAsync("Accountant", ct);
            }

            if (user == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_TAI_KHOAN_NGUOI_DUNG_ID_USERID|{userId}");
            }

            // Check duplicate email
            var duplicateEmail = await _userRepository.IsEmailExistsAsync(request.Email, user.UserId, ct);
            if (duplicateEmail)
            {
                throw new BadRequestException($"ERR_EMAIL_REQUEST_EMAIL_DA_DUOC_SU_DUNG_BOI_TAI_KHOAN|{request.Email}");
            }

            user.Name = request.Name.Trim();
            user.Email = request.Email.Trim();
            user.Phone = request.Phone.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return MapToProfileDto(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);

            if (user == null)
            {
                user = await _userRepository.GetFirstUserByRoleAsync("Accountant", ct);
            }

            if (user == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_TAI_KHOAN_NGUOI_DUNG_ID_USERID|{userId}");
            }

            // Verify password with BCrypt and plain-text fallback
            bool isPasswordCorrect = false;
            if (user.Password == request.CurrentPassword)
            {
                isPasswordCorrect = true; // plain-text match
            }
            else
            {
                try
                {
                    isPasswordCorrect = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password);
                }
                catch
                {
                    isPasswordCorrect = false;
                }
            }

            if (!isPasswordCorrect)
            {
                throw new BadRequestException("ERR_MAT_KHAU_HIEN_TAI_KHONG_CHINH_XAC");
            }

            // Hash new password using BCrypt
            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return true;
        }

        private static UserProfileDto MapToProfileDto(User user)
        {
            return new UserProfileDto
            {
                UserId = user.UserId,
                Name = user.Name,
                Email = user.Email,
                Phone = user.Phone,
                Cccd = user.Cccd,
                RoleId = user.RoleId,
                RoleName = user.Role?.Name ?? "Accountant",
                Department = "Phòng Tài Chính - Kế Toán",
                Office = "Tầng 3, Tòa nhà Điều Hành STMM",
                Avatar = "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
                CreatedAt = user.CreatedAt
            };
        }
    }
}
