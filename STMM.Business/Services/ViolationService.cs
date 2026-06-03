using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

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

        public ViolationService(
            IViolationRepository violationRepository,
            IStallRepository stallRepository,
            IViolationTypeRepository violationTypeRepository,
            IMapper mapper,
            IValidator<CreateViolationRequest> createValidator,
            INotificationService notificationService)
        {
            _violationRepository = violationRepository;
            _stallRepository = stallRepository;
            _violationTypeRepository = violationTypeRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _notificationService = notificationService;
        }

        public async Task<PagedResult<ViolationDto>> GetViolationsAsync(
            int userId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _violationRepository.GetViolationsPagedAsync(
                userId,
                queryParams.Status,
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
            // Validate request
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Check stall exists and is not deleted
            var stalls = await _stallRepository.FindAsync(s => s.StallId == request.StallId && s.IsDeleted != true, ct);
            var stall = stalls.FirstOrDefault();

            if (stall == null)
            {
                throw new NotFoundException($"Stall with ID {request.StallId} not found.");
            }

            // Check violation type exists and is active
            var types = await _violationTypeRepository.FindAsync(vt => vt.ViolationTypeId == request.ViolationTypeId && vt.IsActive != false, ct);
            var violationType = types.FirstOrDefault();

            if (violationType == null)
            {
                throw new NotFoundException($"Violation type with ID {request.ViolationTypeId} was not found or is inactive.");
            }

            // Map and create
            var violation = _mapper.Map<Violation>(request);
            violation.CreatedByUserId = userId;
            violation.Status = "Pending";
            violation.CreatedAt = DateTime.UtcNow;
            violation.UpdatedAt = DateTime.UtcNow;

            // Auto-fill FineAmount if not specified (or is 0) and default fine exists
            if ((violation.FineAmount == null || violation.FineAmount == 0) && violationType.DefaultFine.HasValue)
            {
                violation.FineAmount = violationType.DefaultFine.Value;
            }

            await _violationRepository.AddAsync(violation, ct);
            await _violationRepository.SaveChangesAsync(ct);

            // Assign navigation properties for DTO mapping
            violation.Stall = stall;
            violation.ViolationType = violationType;

            // Send notification to Manager role
            await _notificationService.CreateAsync(new DTOs.Notification.CreateNotificationRequest
            {
                Title = "New Violation Report",
                Content = $"A new violation report is pending approval for stall {stall.Code}.",
                NotiType = "Violation",
                CreatedByUserId = userId,
                TargetRole = "Manager"
            }, ct);

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<IEnumerable<ViolationTypeDto>> GetViolationTypesAsync(CancellationToken ct = default)
        {
            var types = await _violationTypeRepository.FindAsync(vt => vt.IsActive != false, ct);

            return _mapper.Map<IEnumerable<ViolationTypeDto>>(types);
        }
    }
}
