using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
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
        private readonly IStallRepository _stallRepository;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<MeterReadingService> _logger;

        public MeterReadingService(
            IMeterRepository meterRepo,
            IMeterReadingRepository readingRepo,
            IMapper mapper,
            IValidator<CreateMeterReadingRequest> validator,
            IUserRepository userRepository,
            IStallRepository stallRepository,
            IFileUploadService fileUploadService,
            ILogger<MeterReadingService> logger)
        {
            _meterRepo = meterRepo;
            _readingRepo = readingRepo;
            _mapper = mapper;
            _validator = validator;
            _userRepository = userRepository;
            _stallRepository = stallRepository;
            _fileUploadService = fileUploadService;
            _logger = logger;
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



        public async Task<MeterReadingDto> CreateReadingAsync(
            int userId, CreateMeterReadingRequest request, CancellationToken ct = default)
        {
            var validation = await _validator.ValidateAsync(request, ct);
            if (!validation.IsValid)
                throw new BadRequestException(string.Join("; ", validation.Errors.Select(e => e.ErrorMessage)));

            var marketId = await GetStaffMarketIdAsync(userId, ct);
            var recordedAt = DateOnly.ParseExact(request.RecordedAt, "yyyy-MM-dd", CultureInfo.InvariantCulture);

            var meter = await _meterRepo.GetEligibleMeterForReadingAsync(
                request.MeterId, marketId, userId, recordedAt, ct);
            if (meter == null)
            {
                // Preserve the existing inactive-meter error without revealing
                // whether a meter is in another market or lacks an eligible task.
                var marketMeter = await _meterRepo.GetMeterWithStallForMarketAsync(request.MeterId, marketId, ct);
                if (marketMeter != null && marketMeter.IsActive != true)
                    throw new BadRequestException($"Meter {marketMeter.SerialNumber} is inactive.");

                throw new NotFoundException($"Meter with ID {request.MeterId} not found.");
            }

            var exists = await _readingRepo.ExistsByMeterAndDateAsync(request.MeterId, recordedAt, ct);
            if (exists)
                throw new BadRequestException($"A reading already exists for meter {meter.SerialNumber} on {request.RecordedAt}.");

            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(request.MeterId, ct);
            var oldValue = latest?.NewValue ?? 0;

            if (request.NewValue < oldValue)
                throw new BadRequestException($"New value ({request.NewValue}) must be >= previous value ({oldValue}).");

            var uploadedUrl = await _fileUploadService.UploadImageAsync(request.Image, "meter-readings", ct);

            var reading = new MeterReading
            {
                MeterId = request.MeterId,
                OldValue = oldValue,
                NewValue = request.NewValue,
                RecordedAt = recordedAt,
                CreatedByUserId = userId,
                ImageUrl = uploadedUrl
            };

            await _readingRepo.AddAsync(reading, ct);
            try
            {
                await _readingRepo.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save MeterReading entity. Cleaning up uploaded Cloudinary image.");
                await _fileUploadService.DeleteImageAsync(uploadedUrl, ct);

                if (ex is DbUpdateException dbEx && IsMeterReadingUniqueViolation(dbEx))
                {
                    throw new BadRequestException($"A reading already exists for meter {meter.SerialNumber} on {request.RecordedAt}.");
                }
                throw;
            }

            reading.Meter = meter;
            return _mapper.Map<MeterReadingDto>(reading);
        }

        private static bool IsMeterReadingUniqueViolation(DbUpdateException exception)
        {
            return exception.InnerException is PostgresException postgres &&
                   postgres.SqlState == PostgresErrorCodes.UniqueViolation &&
                   postgres.ConstraintName == "meter_readings_meter_id_recorded_at_key";
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
