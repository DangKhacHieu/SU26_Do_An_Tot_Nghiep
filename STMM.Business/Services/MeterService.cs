using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Meter;
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
    public class MeterService : IMeterService
    {
        private readonly IMeterRepository _meterRepo;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateMeterRequest> _createValidator;
        private readonly IValidator<UpdateMeterRequest> _updateValidator;
        private readonly IUserRepository _userRepo;

        public MeterService(
            IMeterRepository meterRepo,
            IMeterReadingRepository readingRepo,
            IMapper mapper,
            IValidator<CreateMeterRequest> createValidator,
            IValidator<UpdateMeterRequest> updateValidator,
            IUserRepository userRepo)
        {
            _meterRepo = meterRepo;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _userRepo = userRepo;
        }

        public async Task<IReadOnlyList<MeterDto>> GetMetersAsync(
            int userId,
            CancellationToken ct = default)
        {
            var user = await _userRepo.GetUserByIdWithRoleAsync(userId, ct);
            if (user != null && !user.MarketId.HasValue && (user.Role == null || string.Equals(user.Role.Name, "Manager", StringComparison.OrdinalIgnoreCase)))
            {
                throw new ForbiddenException("The account is not assigned to a market.");
            }

            var marketId = user?.MarketId;
            var itemsWithLatest = await _meterRepo.GetMetersWithLatestReadingForMarketAsync(marketId, ct);

            return itemsWithLatest.Select(x =>
            {
                var dto = _mapper.Map<MeterDto>(x.Meter);
                dto.LastReadingValue = x.LatestReading?.NewValue;
                dto.LastReadingImageUrl = x.LatestReading?.ImageUrl;
                return dto;
            }).ToList();
        }

        public async Task<MeterDto?> GetMeterByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            if (!currentUserId.HasValue)
            {
                throw new NotFoundException($"Meter with ID {id} not found.");
            }

            var currentUser = await _userRepo.GetUserByIdWithRoleAsync(currentUserId.Value, ct);
            if (currentUser?.MarketId is null)
            {
                throw new NotFoundException($"Meter with ID {id} not found.");
            }

            var result = await _meterRepo.GetMeterWithLatestReadingForMarketAsync(id, currentUser.MarketId.Value, ct);
            if (result == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            var dto = _mapper.Map<MeterDto>(result.Value.Meter);
            dto.LastReadingValue = result.Value.LatestReading?.NewValue;
            dto.LastReadingImageUrl = result.Value.LatestReading?.ImageUrl;

            return dto;
        }

        public async Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, int userId, CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // F-11: dùng GetUserByIdWithRoleAsync (có lọc IsDeleted) thay cho GetByIdAsync,
            // đồng bộ với 5 method còn lại của service. GetByIdAsync là FindAsync thuần,
            // không lọc soft-delete -> Manager đã xoá mềm vẫn tạo được công tơ.
            var user = await _userRepo.GetUserByIdWithRoleAsync(userId, ct);
            if (user == null || user.MarketId == null)
            {
                throw new BadRequestException("The manager account does not own an approved market yet. Meters can only be created once your market is approved.");
            }
            var marketId = user.MarketId.Value;

            // Check SerialNumber unique
            var exists = await _meterRepo.ExistsSerialNumberAsync(request.SerialNumber.Trim(), marketId, null, ct);
            if (exists)
            {
                throw new BadRequestException($"Serial number '{request.SerialNumber}' already exists in this market.");
            }

            var meter = new Meter
            {
                SerialNumber = request.SerialNumber.Trim(),
                Type = request.Type.Trim(),
                IsActive = true,
                StallId = null,
                InstalledAt = null,
                MarketId = marketId
            };

            await _meterRepo.AddAsync(meter, ct);
            await _meterRepo.SaveChangesAsync(ct);

            return _mapper.Map<MeterDto>(meter);
        }

        public async Task<MeterDto> UpdateMeterAsync(int id, UpdateMeterRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var validationResult = await _updateValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var marketId = await GetCallerMarketIdAsync(currentUserId, id, ct);

            var meter = await _meterRepo.GetMeterForUpdateInMarketAsync(id, marketId, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            if (meter.StallId.HasValue && request.Type.Trim() != meter.Type)
            {
                throw new BadRequestException("The type of a meter assigned to a stall cannot be changed.");
            }

            if (meter.StallId.HasValue && !request.IsActive)
            {
                throw new BadRequestException("A meter assigned to a stall cannot be deactivated. Replace or unassign it first.");
            }

            // Check SerialNumber unique
            var exists = await _meterRepo.ExistsSerialNumberAsync(request.SerialNumber.Trim(), meter.MarketId, id, ct);
            if (exists)
            {
                throw new BadRequestException($"Serial number '{request.SerialNumber}' already exists in this market.");
            }

            meter.SerialNumber = request.SerialNumber.Trim();
            meter.Type = request.Type.Trim();
            meter.IsActive = request.IsActive;

            _meterRepo.Update(meter);
            await _meterRepo.SaveChangesAsync(ct);

            return _mapper.Map<MeterDto>(meter);
        }

        public async Task<bool> DeleteMeterAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            var meter = await _meterRepo.GetMeterWithReadingsAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            if (currentUserId.HasValue)
            {
                var user = await _userRepo.GetUserByIdWithRoleAsync(currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue || meter.MarketId != user.MarketId.Value)
                    {
                        throw new NotFoundException($"Meter with ID {id} not found.");
                    }
                }
            }

            if (meter.StallId != null)
            {
                throw new BadRequestException("Cannot delete meter that is currently assigned to a stall.");
            }

            if (meter.MeterReadings != null && meter.MeterReadings.Any())
            {
                throw new BadRequestException("Cannot delete meter that has recorded readings in history.");
            }

            _meterRepo.Delete(meter);
            await _meterRepo.SaveChangesAsync(ct);
            return true;
        }

        public async Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, int userId, CancellationToken ct = default)
        {
            var user = await _userRepo.GetUserByIdWithRoleAsync(userId, ct);
            if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase) && !user.MarketId.HasValue)
            {
                return new List<MeterDto>();
            }

            var marketId = user?.MarketId;

            var itemsWithLatest = await _meterRepo.GetUnassignedMetersWithLatestReadingAsync(type, marketId, ct);

            return itemsWithLatest.Select(x =>
            {
                var dto = _mapper.Map<MeterDto>(x.Meter);
                dto.LastReadingValue = x.LatestReading?.NewValue;
                dto.LastReadingImageUrl = x.LatestReading?.ImageUrl;
                return dto;
            }).ToList();
        }

        public async Task<IEnumerable<MeterDto>> GetMetersByStallIdAsync(int userId, int stallId, CancellationToken ct = default)
        {
            var user = await _userRepo.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException("The account is not assigned to a market.");
            }

            var marketId = user.MarketId.Value;
            var itemsWithLatest = await _meterRepo.GetMetersWithLatestReadingByStallForMarketAsync(stallId, marketId, ct);
            if (itemsWithLatest.Count == 0)
            {
                throw new NotFoundException($"No active meters were found for stall {stallId} in your market.");
            }

            return itemsWithLatest.Select(x =>
            {
                var dto = _mapper.Map<MeterDto>(x.Meter);
                dto.LastReadingValue = x.LatestReading?.NewValue;
                dto.LastReadingImageUrl = x.LatestReading?.ImageUrl;
                return dto;
            }).ToList();
        }

        /// <summary>
        /// F-12: phân giải chợ của người gọi cho các thao tác ghi trên Meter.
        /// Trả về NotFoundException thay vì ForbiddenException để không tiết lộ sự tồn tại của công tơ.
        /// </summary>
        private async Task<int> GetCallerMarketIdAsync(int? currentUserId, int meterId, CancellationToken ct)
        {
            if (!currentUserId.HasValue)
            {
                throw new NotFoundException($"Meter with ID {meterId} not found.");
            }

            var user = await _userRepo.GetUserByIdWithRoleAsync(currentUserId.Value, ct);
            if (user?.MarketId == null)
            {
                throw new NotFoundException($"Meter with ID {meterId} not found.");
            }

            return user.MarketId.Value;
        }
    }
}
