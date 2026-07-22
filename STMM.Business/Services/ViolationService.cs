using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;
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
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IViolationTypeRepository _violationTypeRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateViolationRequest> _createValidator;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<ViolationService> _logger;

        public ViolationService(
            IViolationRepository violationRepository,
            IStallRepository stallRepository,
            IViolationTypeRepository violationTypeRepository,
            IMapper mapper,
            IValidator<CreateViolationRequest> createValidator,
            INotificationService notificationService,
            IUserRepository userRepository,
            ILogger<ViolationService> logger)
        {
            _violationRepository = violationRepository;
            _stallRepository = stallRepository;
            _violationTypeRepository = violationTypeRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _notificationService = notificationService;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<IReadOnlyList<ViolationDto>> GetViolationsAsync(
            int userId,
            CancellationToken ct = default)
        {
            var items = await _violationRepository.GetViolationsForStaffAsync(userId, ct);
            return _mapper.Map<List<ViolationDto>>(items);
        }

        public async Task<ViolationDto> GetViolationByIdAsync(
            int id, int userId, CancellationToken ct = default)
        {
            var violation = await _violationRepository.GetViolationWithStallAsync(id, userId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"Violation with ID {id} not found.");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<ViolationDto> CreateViolationAsync(
            int userId, CreateViolationRequest request, CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var marketId = await GetMarketIdAsync(userId, "staff", ct);
            var stall = await _stallRepository.GetStallForMarketAsync(request.StallId, marketId, ct)
                ?? throw new NotFoundException($"Stall with ID {request.StallId} not found.");

            var types = await _violationTypeRepository.FindAsync(vt => vt.ViolationTypeId == request.ViolationTypeId && vt.IsActive != false, ct);
            var violationType = types.FirstOrDefault();

            if (violationType == null)
            {
                throw new NotFoundException($"Violation type with ID {request.ViolationTypeId} was not found or is inactive.");
            }

            var managers = await _userRepository.GetActiveManagersByMarketAsync(
                marketId, ct);

            var violation = _mapper.Map<Violation>(request);
            violation.CreatedByUserId = userId;
            violation.Status = "Pending";
            violation.CreatedAt = DateTime.UtcNow;
            violation.UpdatedAt = DateTime.UtcNow;

            if ((violation.FineAmount == null || violation.FineAmount == 0) && violationType.DefaultFine.HasValue)
            {
                violation.FineAmount = violationType.DefaultFine.Value;
            }

            await _violationRepository.AddAsync(violation, ct);
            await _violationRepository.SaveChangesAsync(ct);

            violation.Stall = stall;
            violation.ViolationType = violationType;

            foreach (var manager in managers)
            {
                try
                {
                    await _notificationService.CreateAsync(new DTOs.Notification.CreateNotificationRequest
                    {
                        Title = "New Violation Report",
                        Content = $"A new violation report is pending approval for stall {stall.Code}.",
                        NotiType = "Violation",
                        CreatedByUserId = userId,
                        TargetUserId = manager.UserId
                    }, ct);
                }
                catch (Exception exception)
                {
                    _logger.LogError(
                        exception,
                        "Unable to notify manager {ManagerUserId} about violation {ViolationId}.",
                        manager.UserId,
                        violation.ViolationId);
                }
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<IEnumerable<ViolationTypeDto>> GetViolationTypesAsync(CancellationToken ct = default)
        {
            var types = await _violationTypeRepository.FindAsync(vt => vt.IsActive != false, ct);
            return _mapper.Map<IEnumerable<ViolationTypeDto>>(types);
        }

        public async Task<PagedResult<ViolationDto>> GetViolationsForManagerAsync(
            int managerUserId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var marketId = await GetMarketIdAsync(managerUserId, "manager", ct);
            var (items, totalCount) = await _violationRepository.GetViolationsPagedForManagerAsync(
                marketId,
                queryParams.Status,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            return new PagedResult<ViolationDto>
            {
                Items = _mapper.Map<IEnumerable<ViolationDto>>(items),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<ViolationDto> GetViolationByIdForManagerAsync(
            int managerUserId, int id, CancellationToken ct = default)
        {
            var marketId = await GetMarketIdAsync(managerUserId, "manager", ct);
            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(id, marketId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"Violation with ID {id} not found.");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        private async Task<int> GetMarketIdAsync(int userId, string accountType, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException($"The {accountType} account is not assigned to a market.");
            }

            return user.MarketId.Value;
        }

        public async Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default)
        {
            return await _violationRepository.SimulateViolationAppealAsync(violationId, ct);
        }

        // --- ACCOUNTANT ADDITIONS ---

        public async Task<IEnumerable<ViolationDto>> GetAllViolationsAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            IQueryable<Violation> query = _violationRepository.Query()
                .Include(v => v.Stall)
                .Include(v => v.ViolationType);

            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                if (user?.MarketId != null)
                {
                    query = query.Where(v => v.Stall.Area.MarketId == user.MarketId);
                }
            }

            var list = await query
                .OrderByDescending(v => v.ViolationId)
                .ToListAsync(ct);

            return _mapper.Map<IEnumerable<ViolationDto>>(list);
        }

        public async Task<IEnumerable<ViolationTypeDto>> GetAllViolationTypesWithInactiveAsync(CancellationToken ct = default)
        {
            var list = await _violationTypeRepository.GetAllAsync(ct);
            return _mapper.Map<IEnumerable<ViolationTypeDto>>(list);
        }

        public async Task<ViolationTypeDto> CreateViolationTypeAsync(CreateViolationTypeRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                throw new BadRequestException("Tên loại vi phạm không được để trống.");
            }

            var vt = new ViolationType
            {
                Name = request.Name,
                Description = request.Description,
                DefaultFine = request.DefaultFine,
                IsActive = true
            };

            await _violationTypeRepository.AddAsync(vt, ct);
            await _violationTypeRepository.SaveChangesAsync(ct);

            return _mapper.Map<ViolationTypeDto>(vt);
        }

        public async Task<ViolationTypeDto> UpdateViolationTypeAsync(int id, UpdateViolationTypeRequest request, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null)
            {
                throw new NotFoundException($"Không tìm thấy Loại vi phạm ID {id}.");
            }

            vt.Name = request.Name;
            vt.Description = request.Description;
            vt.DefaultFine = request.DefaultFine;
            vt.IsActive = request.IsActive;

            _violationTypeRepository.Update(vt);
            await _violationTypeRepository.SaveChangesAsync(ct);

            return _mapper.Map<ViolationTypeDto>(vt);
        }

        public async Task<bool> DeleteViolationTypeAsync(int id, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null) return false;

            // Xóa mềm: ẩn hoạt động
            vt.IsActive = false;
            _violationTypeRepository.Update(vt);

            await _violationTypeRepository.SaveChangesAsync(ct);
            return true;
        }
    }
}
