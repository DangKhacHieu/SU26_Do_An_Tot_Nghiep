using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Auth;
using STMM.Business.DTOs.User;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<EditProfileRequest> _validator;

        public UserService(
            IUserRepository userRepository,
            IMapper mapper,
            IValidator<EditProfileRequest> validator)
        {
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _validator = validator ?? throw new ArgumentNullException(nameof(validator));
        }

        public async Task<UserDto> UpdateProfileAsync(int userId, EditProfileRequest request, CancellationToken ct = default)
        {
            // 1. Validate request
            var validationResult = await _validator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                var errors = string.Join(", ", validationResult.Errors.Select(e => e.ErrorMessage));
                throw new BadRequestException(errors);
            }

            // 2. Fetch user (including Role for DTO mapping later)
            var user = await _userRepository.Query()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == userId && u.IsDeleted != true, ct);

            if (user == null)
            {
                throw new NotFoundException("Không tìm thấy người dùng");
            }

            request.Phone = request.Phone.Trim();
            request.Name = request.Name.Trim();

            // 3. If phone is updated, check if it's already in use by another user
            if (user.Phone != request.Phone)
            {
                var isPhoneDuplicate = await _userRepository.Query()
                    .AnyAsync(u => u.Phone == request.Phone && u.UserId != userId && u.IsDeleted != true, ct);

                if (isPhoneDuplicate)
                {
                    throw new BadRequestException("Số điện thoại đã được sử dụng bởi tài khoản khác");
                }
            }

            // 4. Update fields
            user.Name = request.Name;
            user.Phone = request.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            // 5. Save changes
            await _userRepository.SaveChangesAsync(ct);

            // 6. Map to UserDto and return
            return _mapper.Map<UserDto>(user);
        }
    }
}
