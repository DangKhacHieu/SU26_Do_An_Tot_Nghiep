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
        private readonly IValidator<MeterReplacementRequest> _replaceValidator;

        public MeterService(
            IMeterRepository meterRepo,
            IMeterReadingRepository readingRepo,
            IMapper mapper,
            IValidator<CreateMeterRequest> createValidator,
            IValidator<UpdateMeterRequest> updateValidator,
            IValidator<MeterReplacementRequest> replaceValidator)
        {
            _meterRepo = meterRepo;
            _readingRepo = readingRepo;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _replaceValidator = replaceValidator;
        }

        public async Task<PagedResult<MeterDto>> GetMetersAsync(MeterQueryParameters queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _meterRepo.GetMetersPagedAsync(
                queryParams.Type,
                queryParams.IsActive,
                queryParams.IsAssigned,
                queryParams.Search,
                queryParams.PageNumber,
                queryParams.PageSize,
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

        public async Task<MeterDto?> GetMeterByIdAsync(int id, CancellationToken ct = default)
        {
            var meter = await _meterRepo.GetMeterWithStallAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

            var dto = _mapper.Map<MeterDto>(meter);
            var latest = await _readingRepo.GetLatestReadingByMeterIdAsync(id, ct);
            dto.LastReadingValue = latest?.NewValue;
            dto.LastReadingImageUrl = latest?.ImageUrl;

            return dto;
        }

        public async Task<MeterDto> CreateMeterAsync(CreateMeterRequest request, CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
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
                InstalledAt = null
            };

            await _meterRepo.AddAsync(meter, ct);
            await _meterRepo.SaveChangesAsync(ct);

            return _mapper.Map<MeterDto>(meter);
        }

        public async Task<MeterDto> UpdateMeterAsync(int id, UpdateMeterRequest request, CancellationToken ct = default)
        {
            var validationResult = await _updateValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var meter = await _meterRepo.GetByIdAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

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

        public async Task<bool> DeleteMeterAsync(int id, CancellationToken ct = default)
        {
            var meter = await _meterRepo.GetMeterWithReadingsAsync(id, ct);
            if (meter == null)
                throw new NotFoundException($"Meter with ID {id} not found.");

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

        public async Task<bool> ReplaceMeterAsync(MeterReplacementRequest request, CancellationToken ct = default)
        {
            var validationResult = await _replaceValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var oldMeter = await _meterRepo.GetByIdAsync(request.OldMeterId, ct);
            if (oldMeter == null)
                throw new NotFoundException($"Old meter with ID {request.OldMeterId} not found.");

            if (oldMeter.StallId != request.StallId)
            {
                throw new BadRequestException("Old meter does not belong to specified stall.");
            }

            if (oldMeter.IsActive != true)
            {
                throw new BadRequestException("Old meter is already inactive.");
            }

            var newMeter = await _meterRepo.GetByIdAsync(request.NewMeterId, ct);
            if (newMeter == null)
                throw new NotFoundException($"New meter with ID {request.NewMeterId} not found.");

            if (newMeter.StallId != null)
            {
                throw new BadRequestException("New meter is already assigned to another stall.");
            }

            if (newMeter.IsActive != true)
            {
                throw new BadRequestException("New meter is inactive.");
            }

            if (newMeter.Type != oldMeter.Type)
            {
                throw new BadRequestException("New meter must be of the same type as old meter.");
            }

            // Deactivate old meter
            oldMeter.IsActive = false;
            _meterRepo.Update(oldMeter);

            // Assign new meter
            newMeter.StallId = request.StallId;
            newMeter.IsActive = true;
            newMeter.InstalledAt = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            _meterRepo.Update(newMeter);

            await _meterRepo.SaveChangesAsync(ct);
            return true;
        }

        public async Task<IEnumerable<MeterDto>> GetUnassignedMetersAsync(string? type, CancellationToken ct = default)
        {
            var meters = await _meterRepo.GetUnassignedMetersAsync(type, ct);
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
