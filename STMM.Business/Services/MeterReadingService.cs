using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Meter;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class MeterReadingService : IMeterReadingService
    {
        private readonly IMeterRepository _meterRepo;
        private readonly IMeterReadingRepository _readingRepo;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateMeterReadingRequest> _validator;
        private readonly IUserRepository _userRepository;
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly IStallRepository _stallRepository;

        public MeterReadingService(
            IMeterRepository meterRepo,
            IMeterReadingRepository readingRepo,
            IMapper mapper,
            IValidator<CreateMeterReadingRequest> validator,
            IUserRepository userRepository,
            IStaffTaskRepository staffTaskRepository,
            IStallRepository stallRepository)
        {
            _meterRepo = meterRepo;
            _readingRepo = readingRepo;
            _mapper = mapper;
            _validator = validator;
            _userRepository = userRepository;
            _staffTaskRepository = staffTaskRepository;
            _stallRepository = stallRepository;
        }

        public async Task<PagedResult<MeterReadingDto>> GetReadingsByStallIdAsync(
            int userId, int stallId, MeterReadingQueryParams query, CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(userId, ct);
            var (items, totalCount) = await _readingRepo.GetReadingsByStallIdPagedAsync(
                stallId, marketId, query.MeterType, query.PageNumber, query.PageSize, ct);

            if (totalCount == 0)
            {
                var stall = await _stallRepository.GetStallForMarketAsync(stallId, marketId, ct);
                if (stall == null)
                {
                    throw new NotFoundException($"Stall with ID {stallId} was not found in your market.");
                }
            }

            return new PagedResult<MeterReadingDto>
            {
                Items = _mapper.Map<IEnumerable<MeterReadingDto>>(items),
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };
        }

        public async Task<MeterDto> GetMeterByIdAsync(int userId, int meterId, CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(userId, ct);
            var meter = await _meterRepo.GetMeterWithStallForMarketAsync(meterId, marketId, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {meterId} not found.");

            var dto = _mapper.Map<MeterDto>(meter);
            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(meterId, ct);
            dto.LastReadingValue = latest?.NewValue;
            dto.LastReadingImageUrl = latest?.ImageUrl;

            return dto;
        }

        public async Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, CancellationToken ct = default)
        {
            var meters = await _meterRepo.FindAsync(m => m.StallId == null && m.IsActive == true);
            if (!string.IsNullOrEmpty(type))
            {
                meters = meters.Where(m => m.Type == type);
            }
            return _mapper.Map<IEnumerable<MeterDto>>(meters);
        }

        public async Task<IEnumerable<MeterDto>> GetMetersByStallIdAsync(int userId, int stallId, CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(userId, ct);
            var meters = (await _meterRepo.GetMetersByStallForMarketAsync(stallId, marketId, ct)).ToList();
            if (meters.Count == 0)
            {
                throw new NotFoundException($"No active meters were found for stall {stallId} in your market.");
            }

            var dtos = _mapper.Map<IEnumerable<MeterDto>>(meters).ToList();

            foreach (var dto in dtos)
            {
                var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(dto.MeterId, ct);
                dto.LastReadingValue = latest?.NewValue;
            }

            return dtos;
        }

        public async Task<MeterReadingDto> CreateReadingAsync(
            int userId, CreateMeterReadingRequest request, CancellationToken ct = default)
        {
            var validation = await _validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                throw new BadRequestException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

            var marketId = await GetStaffMarketIdAsync(userId, ct);
            var meter = await _meterRepo.GetMeterWithStallForMarketAsync(request.MeterId, marketId, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {request.MeterId} not found.");
            if (meter.IsActive != true)
                throw new BadRequestException($"Meter {meter.SerialNumber} is inactive.");
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            if (!meter.StallId.HasValue ||
                !await _staffTaskRepository.HasActiveUtilityTaskForStallAsync(
                    userId,
                    meter.StallId.Value,
                    effectiveDate,
                    ct))
            {
                throw new NotFoundException($"Meter with ID {request.MeterId} not found.");
            }

            var recordedAt = DateOnly.ParseExact(request.RecordedAt, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            var exists = await _readingRepo.ExistsByMeterAndDateAsync(request.MeterId, recordedAt, ct);
            if (exists)
                throw new BadRequestException($"A reading already exists for meter {meter.SerialNumber} on {request.RecordedAt}.");

            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(request.MeterId, ct);
            var oldValue = latest?.NewValue ?? 0;

            if (request.NewValue < oldValue)
                throw new BadRequestException($"New value ({request.NewValue}) must be >= previous value ({oldValue}).");

            var reading = new MeterReading
            {
                MeterId = request.MeterId,
                OldValue = oldValue,
                NewValue = request.NewValue,
                RecordedAt = recordedAt,
                CreatedByUserId = userId,
                ImageUrl = request.ImageUrl
            };

            await _readingRepo.AddAsync(reading, ct);
            await _readingRepo.SaveChangesAsync(ct);

            reading.Meter = meter;
            return _mapper.Map<MeterReadingDto>(reading);
        }

        private async Task<int> GetStaffMarketIdAsync(int userId, CancellationToken ct)
        {
            var staff = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (staff?.MarketId == null)
            {
                throw new ForbiddenException("The staff account is not assigned to a market.");
            }

            return staff.MarketId.Value;
        }
    }
}
