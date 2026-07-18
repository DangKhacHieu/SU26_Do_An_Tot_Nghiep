using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IRoleRepository _roleRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateUserRequest> _createUserValidator;
        private readonly IValidator<UpdateUserRequest> _updateUserValidator;
        private readonly IValidator<EditProfileRequest> _editProfileValidator;

        public UserService(
            IUserRepository userRepository,
            IRoleRepository roleRepository,
            IMapper mapper,
            IValidator<CreateUserRequest> createUserValidator,
            IValidator<UpdateUserRequest> updateUserValidator,
            IValidator<EditProfileRequest> editProfileValidator)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _roleRepository = roleRepository ?? throw new ArgumentNullException(nameof(roleRepository));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _createUserValidator = createUserValidator ?? throw new ArgumentNullException(nameof(createUserValidator));
            _updateUserValidator = updateUserValidator ?? throw new ArgumentNullException(nameof(updateUserValidator));
            _editProfileValidator = editProfileValidator ?? throw new ArgumentNullException(nameof(editProfileValidator));
        }

        public async Task<IEnumerable<UserDto>> GetUsersAsync(string? roleName, string? search, CancellationToken ct = default)
        {
            var users = await _userRepository.GetUsersWithRolesAsync(
                roleName,
                search,
                limitToManageableRoles: true,
                ct);

            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<UserDetailDto> GetUserByIdAsync(int id, CancellationToken ct = default)
        {
            if (id <= 0)
            {
                throw new BadRequestException("ID người dùng không hợp lệ.");
            }

            var user = await _userRepository.GetUserByIdWithRoleAsync(id, ct);

            if (user == null)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {id}.");
            }

            return _mapper.Map<UserDetailDto>(user);
        }

        public async Task<UserDto> RegisterUserAsync(CreateUserRequest request, CancellationToken ct = default)
        {
            var validationResult = await _createUserValidator.ValidateAsync(request, ct);

            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var role = await _roleRepository.GetByIdAsync(request.RoleId, ct);

            if (role == null)
            {
                throw new BadRequestException("Vai trò được chọn không tồn tại.");
            }

            var existingEmails = await _userRepository.FindAsync(
                u => u.Email.ToLower() == request.Email.ToLower()
                     && u.IsDeleted != true,
                ct);

            if (existingEmails.Any())
            {
                throw new BadRequestException("Email này đã được sử dụng.");
            }

            var existingPhones = await _userRepository.FindAsync(
                u => u.Phone == request.Phone
                     && u.IsDeleted != true,
                ct);

            if (existingPhones.Any())
            {
                throw new BadRequestException("Số điện thoại này đã được sử dụng.");
            }

            var existingCccds = await _userRepository.FindAsync(
                u => u.Cccd == request.Cccd
                     && u.IsDeleted != true,
                ct);

            if (existingCccds.Any())
            {
                throw new BadRequestException("Số CCCD này đã được sử dụng.");
            }

            var hashedPassword = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                RoleId = request.RoleId,
                Name = request.Name,
                Email = request.Email,
                Password = hashedPassword,
                Phone = request.Phone,
                Cccd = request.Cccd,
                Status = "Active",
                IsDeleted = false,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _userRepository.AddAsync(user, ct);
            await _userRepository.SaveChangesAsync(ct);

            user.Role = role;

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateUserAsync(int id, UpdateUserRequest request, CancellationToken ct = default)
        {
            var validationResult = await _updateUserValidator.ValidateAsync(request, ct);

            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var user = await _userRepository.GetUserByIdWithRoleAsync(id, ct);

            if (user == null)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {id}.");
            }

            var role = await _roleRepository.GetByIdAsync(request.RoleId, ct);

            if (role == null)
            {
                throw new BadRequestException("Vai trò được chọn không tồn tại.");
            }

            var existingEmails = await _userRepository.FindAsync(
                u => u.Email.ToLower() == request.Email.ToLower()
                     && u.UserId != id
                     && u.IsDeleted != true,
                ct);

            if (existingEmails.Any())
            {
                throw new BadRequestException("Email này đã được sử dụng bởi người dùng khác.");
            }

            var existingPhones = await _userRepository.FindAsync(
                u => u.Phone == request.Phone
                     && u.UserId != id
                     && u.IsDeleted != true,
                ct);

            if (existingPhones.Any())
            {
                throw new BadRequestException("Số điện thoại này đã được sử dụng bởi người dùng khác.");
            }

            var existingCccds = await _userRepository.FindAsync(
                u => u.Cccd == request.Cccd
                     && u.UserId != id
                     && u.IsDeleted != true,
                ct);

            if (existingCccds.Any())
            {
                throw new BadRequestException("Số CCCD này đã được sử dụng bởi người dùng khác.");
            }

            user.RoleId = request.RoleId;
            user.Name = request.Name;
            user.Email = request.Email;
            user.Phone = request.Phone;
            user.Cccd = request.Cccd;
            user.Status = request.Status;
            user.UpdatedAt = DateTime.UtcNow;

            if (!string.IsNullOrEmpty(request.Password))
            {
                user.Password = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            user.Role = role;

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> UpdateProfileAsync(int userId, EditProfileRequest request, CancellationToken ct = default)
        {
            if (userId <= 0)
            {
                throw new BadRequestException("ID người dùng không hợp lệ.");
            }

            if (request == null)
            {
                throw new BadRequestException("Dữ liệu không hợp lệ.");
            }

            var validationResult = await _editProfileValidator.ValidateAsync(request, ct);

            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            var user = await _userRepository.Query()
                .Include(u => u.Role)
                .Include(u => u.Vendor)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.IsDeleted != true, ct);

            if (user == null)
            {
                throw new NotFoundException("Không tìm thấy người dùng");
            }

            request.Name = request.Name.Trim();
            request.Phone = request.Phone.Trim();

            if (user.Phone != request.Phone)
            {
                var isPhoneDuplicate = await _userRepository.Query()
                    .AnyAsync(
                        u => u.Phone == request.Phone
                             && u.UserId != userId
                             && u.IsDeleted != true,
                        ct);

                if (isPhoneDuplicate)
                {
                    throw new BadRequestException("Số điện thoại đã được sử dụng bởi tài khoản khác");
                }
            }

            user.Name = request.Name;
            user.Phone = request.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            if (user.Vendor != null && request.BusinessName != null)
            {
                user.Vendor.BusinessName = request.BusinessName;
            }

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<UserDto> LockUnlockUserAsync(int id, string status, CancellationToken ct = default)
        {
            if (status != "Active" && status != "Locked" && status != "Suspended")
            {
                throw new BadRequestException("Trạng thái không hợp lệ. Phải là Active, Locked hoặc Suspended.");
            }

            var user = await _userRepository.GetUserByIdWithRoleAsync(id, ct);

            if (user == null)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {id}.");
            }

            user.Status = status;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> DeleteUserAsync(int id, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(id, ct);

            if (user == null || user.IsDeleted == true)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {id}.");
            }

            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            var result = await _userRepository.SaveChangesAsync(ct);

            return result > 0;
        }

        public async Task<IEnumerable<RoleDto>> GetRolesAsync(CancellationToken ct = default)
        {
            var roles = await _roleRepository.GetAllAsync(ct);

            var manageableRoles = new[]
            {
                "staff",
                "accountant",
                "vendor",
                "customer"
            };

            var filteredRoles = roles.Where(r => manageableRoles.Contains(r.Name.ToLower()));

            return _mapper.Map<IEnumerable<RoleDto>>(filteredRoles);
        }

        public async Task<IEnumerable<UserDto>> GetAdminUsersAsync(string? roleName, string? search, CancellationToken ct = default)
        {
            var users = await _userRepository.GetUsersWithRolesAsync(
                roleName,
                search,
                limitToManageableRoles: false,
                ct);

            return _mapper.Map<IEnumerable<UserDto>>(users);
        }

        public async Task<IEnumerable<RoleDto>> GetAdminRolesAsync(CancellationToken ct = default)
        {
            var roles = await _roleRepository.GetAllAsync(ct);
            return _mapper.Map<IEnumerable<RoleDto>>(roles);
        }

        public async Task<UserDto> ResetPasswordAsync(int id, string newPassword, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(newPassword) || newPassword.Length < 6)
            {
                throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự.");
            }

            var user = await _userRepository.GetUserByIdWithRoleAsync(id, ct);

            if (user == null)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {id}.");
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return _mapper.Map<UserDto>(user);
        }

        public async Task<bool> ChangePasswordAsync(int userId, STMM.Business.DTOs.User.ChangePasswordRequest request, CancellationToken ct = default)
        {
            if (request.NewPassword != request.ConfirmPassword)
            {
                throw new BadRequestException("Mật khẩu xác nhận không khớp.");
            }

            if (request.NewPassword.Length < 6)
            {
                throw new BadRequestException("Mật khẩu mới phải có ít nhất 6 ký tự.");
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user == null || user.IsDeleted == true)
            {
                throw new NotFoundException("Không tìm thấy người dùng.");
            }

            if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.Password))
            {
                throw new BadRequestException("Mật khẩu hiện tại không chính xác.");
            }

            if (BCrypt.Net.BCrypt.Verify(request.NewPassword, user.Password))
            {
                throw new BadRequestException("Mật khẩu mới không được trùng với mật khẩu hiện tại.");
            }

            user.Password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            user.UpdatedAt = DateTime.UtcNow;

            _userRepository.Update(user);
            await _userRepository.SaveChangesAsync(ct);

            return true;
        }
    }
}