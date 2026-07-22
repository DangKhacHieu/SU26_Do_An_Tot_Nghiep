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
        private readonly IMeterReadingRepository _readingRepo;
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
            _readingRepo = readingRepo;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _userRepo = userRepo;
        }

        public async Task<PagedResult<MeterDto>> GetMetersAsync(MeterQueryParameters queryParams, int userId, CancellationToken ct = default)
        {
            var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
            {
                if (!user.MarketId.HasValue)
                {
                    return new PagedResult<MeterDto>
                    {
                        Items = new List<MeterDto>(),
                        TotalCount = 0,
                        PageNumber = queryParams.PageNumber,
                        PageSize = queryParams.PageSize
                    };
                }
            }

            var marketId = user?.MarketId;

            var (items, totalCount) = await _meterRepo.GetMetersPagedAsync(
                queryParams.Type,
                queryParams.IsActive,
                queryParams.IsAssigned,
                queryParams.Search,
                queryParams.PageNumber,
                queryParams.PageSize,
                marketId,
                ct);

            var dtos = _mapper.Map<IEnumerable<MeterDto>>(items).ToList();
            foreach (var dto in dtos)
            {
                var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(dto.MeterId, ct);
                dto.LastReadingValue = latest?.NewValue;
                dto.LastReadingImageUrl = latest?.ImageUrl;
            }

            return new PagedResult<MeterDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<MeterDto?> GetMeterByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            if (currentUserId.HasValue)
            {
                var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase) && !user.MarketId.HasValue)
                {
                    throw new NotFoundException($"Meter with ID {id} not found.");
                }
            }

            var meter = await _meterRepo.GetMeterWithStallAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            if (currentUserId.HasValue)
            {
                var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (meter.MarketId != user.MarketId)
                    {
                        throw new NotFoundException($"Meter with ID {id} not found.");
                    }
                }
            }

            var dto = _mapper.Map<MeterDto>(meter);
            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(id, ct);
            dto.LastReadingValue = latest?.NewValue;
            dto.LastReadingImageUrl = latest?.ImageUrl;

            return dto;
        }

        public async Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, int userId, CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var user = await _userRepo.GetByIdAsync(userId, ct);
            if (user == null || user.MarketId == null)
            {
                throw new BadRequestException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt. Bạn chỉ có thể tạo công tơ mới sau khi chợ của bạn được phê duyệt.");
            }

            // Check SerialNumber unique
            var exists = await _meterRepo.ExistsSerialNumberAsync(request.SerialNumber.Trim(), null, ct);
            if (exists)
            {
                throw new BadRequestException($"SerialNumber '{request.SerialNumber}' already exists in system.");
            }

            var meter = new Meter
            {
                SerialNumber = request.SerialNumber.Trim(),
                Type = request.Type.Trim(),
                IsActive = true,
                StallId = null,
                InstalledAt = null,
                MarketId = user.MarketId.Value
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

            var meter = await _meterRepo.GetByIdAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            if (currentUserId.HasValue)
            {
                var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue || meter.MarketId != user.MarketId.Value)
                    {
                        throw new NotFoundException($"Meter with ID {id} not found.");
                    }
                }
            }

            // Check SerialNumber unique
            var exists = await _meterRepo.ExistsSerialNumberAsync(request.SerialNumber.Trim(), id, ct);
            if (exists)
            {
                throw new BadRequestException($"SerialNumber '{request.SerialNumber}' already exists in system.");
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
                var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
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
            var user = await _userRepo.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == userId, ct);
            if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase) && !user.MarketId.HasValue)
            {
                return new List<MeterDto>();
            }

            var marketId = user?.MarketId;

            var meters = await _meterRepo.GetUnassignedMetersAsync(type, marketId, ct);
            var dtos = _mapper.Map<IEnumerable<MeterDto>>(meters).ToList();
            foreach (var dto in dtos)
            {
                var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(dto.MeterId, ct);
                dto.LastReadingValue = latest?.NewValue;
                dto.LastReadingImageUrl = latest?.ImageUrl;
            }
            return dtos;
        }
    }
}
