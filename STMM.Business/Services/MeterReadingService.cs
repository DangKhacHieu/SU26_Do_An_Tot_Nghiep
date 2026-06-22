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

        public MeterReadingService(
            IMeterRepository meterRepo,
            IMeterReadingRepository readingRepo,
            IMapper mapper,
            IValidator<CreateMeterReadingRequest> validator)
        {
            _meterRepo = meterRepo;
            _readingRepo = readingRepo;
            _mapper = mapper;
            _validator = validator;
        }

        public async Task<PagedResult<MeterReadingDto>> GetReadingsByStallIdAsync(
            int stallId, MeterReadingQueryParams query, CancellationToken ct = default)
        {
            var (items, totalCount) = await _readingRepo.GetReadingsByStallIdPagedAsync(
                stallId, query.MeterType, query.PageNumber, query.PageSize, ct);

            return new PagedResult<MeterReadingDto>
            {
                Items = _mapper.Map<IEnumerable<MeterReadingDto>>(items),
                TotalCount = totalCount,
                PageNumber = query.PageNumber,
                PageSize = query.PageSize
            };
        }

        public async Task<MeterDto> GetMeterByIdAsync(int meterId, CancellationToken ct = default)
        {
            var meter = await _meterRepo.GetMeterWithStallAsync(meterId, ct);
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

        public async Task<IEnumerable<MeterDto>> GetMetersByStallIdAsync(int stallId, CancellationToken ct = default)
        {
            var meters = await _meterRepo.GetMetersByStallIdAsync(stallId, ct);
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
            // 1. Validate request fields
            var validation = await _validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                throw new BadRequestException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

            // 2. Check meter exists and is active
            var meter = await _meterRepo.GetMeterWithStallAsync(request.MeterId, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {request.MeterId} not found.");
            if (meter.IsActive != true)
                throw new BadRequestException($"Meter {meter.SerialNumber} is inactive.");

            // 3. Parse recorded date securely
            var recordedAt = DateOnly.ParseExact(request.RecordedAt, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            // 4. Check duplicate date for same meter
            var exists = await _readingRepo.ExistsByMeterAndDateAsync(request.MeterId, recordedAt, ct);
            if (exists)
                throw new BadRequestException($"A reading already exists for meter {meter.SerialNumber} on {request.RecordedAt}.");

            // 5. Get latest reading to auto-fill OldValue
            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(request.MeterId, ct);
            var oldValue = request.IsReplaced ? 0 : (latest?.NewValue ?? 0);

            // 6. Validate new_value >= old_value
            if (!request.IsReplaced && request.NewValue < oldValue)
                throw new BadRequestException($"New value ({request.NewValue}) must be >= previous value ({oldValue}).");

            // 7. Create entity
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

            // 8. Map to DTO (attach navigation for mapping)
            reading.Meter = meter;
            return _mapper.Map<MeterReadingDto>(reading);
        }
    }
}
