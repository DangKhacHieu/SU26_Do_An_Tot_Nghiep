using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Issue;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using DBTask = STMM.DataAccess.Entities.StaffTask;

namespace STMM.Business.Services
{
    public class IssueService : IIssueService
    {
        private readonly IIssueRepository _issueRepository;
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateIssueRequest> _createValidator;
        private readonly IValidator<UpdateIssueStatusRequest> _updateStatusValidator;

        // Valid state transitions
        private static readonly Dictionary<string, string> ValidTransitions = new()
        {
            { "Reported", "InProgress" },
            { "InProgress", "Resolved" }
        };

        public IssueService(
            IIssueRepository issueRepository,
            IStaffTaskRepository staffTaskRepository,
            IStallRepository stallRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IValidator<CreateIssueRequest> createValidator,
            IValidator<UpdateIssueStatusRequest> updateStatusValidator)
        {
            _issueRepository = issueRepository;
            _staffTaskRepository = staffTaskRepository;
            _stallRepository = stallRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateStatusValidator = updateStatusValidator;
        }

        /// <inheritdoc />
        public async Task<PagedResult<IssueDto>> GetIssuesAsync(
            int staffUserId, IssueQueryParams queryParams, CancellationToken ct = default)
        {
            var assignedIssueIds = await _staffTaskRepository.GetAssignedIssueIdsAsync(staffUserId, ct);

            var (items, totalCount) = await _issueRepository.GetIssuesPagedAsync(
                staffUserId,
                assignedIssueIds,
                queryParams.Status,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            return new PagedResult<IssueDto>
            {
                Items = items.Select(MapIssueToDto),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        /// <inheritdoc />
        public async Task<IssueDto> GetIssueByIdAsync(
            int issueId, int staffUserId, CancellationToken ct = default)
        {
            var hasAccess = await HasAccessToIssueAsync(issueId, staffUserId, ct);
            if (!hasAccess)
            {
                throw new NotFoundException($"Issue with ID {issueId} not found.");
            }

            var issue = await _issueRepository.GetIssueWithRelationsAsync(issueId, tracking: false, ct);

            return MapIssueToDto(issue!);
        }

        /// <inheritdoc />
        public async Task<IssueDto> CreateIssueAsync(
            int staffUserId, CreateIssueRequest request, CancellationToken ct = default)
        {
            // Validate request
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Check stall exists
            var stalls = await _stallRepository.FindAsync(s => s.StallId == request.StallId && s.IsDeleted != true, ct);
            var stall = stalls.FirstOrDefault();

            if (stall == null)
            {
                throw new NotFoundException($"Stall with ID {request.StallId} not found.");
            }

            // Create issue (initial status = Reported)
            var issue = new Issue
            {
                StallId = request.StallId,
                CreatedByUserId = staffUserId,
                Title = request.Title,
                Description = request.Description,
                ImageUrl = request.ImageUrl,
                Status = "Reported",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _issueRepository.AddAsync(issue, ct);
            await _issueRepository.SaveChangesAsync(ct);

            // Assign navigation for mapping
            issue.Stall = stall;

            // Reload CreatedByUser for DTO
            var users = await _userRepository.FindAsync(u => u.UserId == staffUserId, ct);
            issue.CreatedByUser = users.FirstOrDefault()!;

            return MapIssueToDto(issue);
        }

        /// <inheritdoc />
        public async Task<IssueDto> UpdateIssueStatusAsync(
            int staffUserId, int issueId, UpdateIssueStatusRequest request, CancellationToken ct = default)
        {
            // Validate request
            var validationResult = await _updateStatusValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Authorization check: only update issues assigned to this staff user
            var tasks = await _staffTaskRepository.FindAsync(t => t.IssueId == issueId && t.AssignedToUserId == staffUserId, ct);
            var assignedTask = tasks.FirstOrDefault();

            if (assignedTask == null)
            {
                throw new NotFoundException(
                    $"You are not assigned to handle issue ID {issueId}.");
            }

            // Load issue
            var issue = await _issueRepository.GetIssueWithRelationsAsync(issueId, tracking: true, ct);

            if (issue == null)
            {
                throw new NotFoundException($"Issue with ID {issueId} not found.");
            }

            // Validate state transition
            var currentStatus = issue.Status ?? "Reported";
            if (!ValidTransitions.TryGetValue(currentStatus, out var expectedNext) ||
                expectedNext != request.NewStatus)
            {
                throw new BadRequestException(
                    $"Cannot transition status from '{currentStatus}' to '{request.NewStatus}'. " +
                    $"Allowed transition: {currentStatus} → {expectedNext ?? "(end)"}.");
            }

            // Update issue
            issue.Status = request.NewStatus;
            issue.UpdatedAt = DateTime.UtcNow;

            // If Resolved -> auto-update linked StaffTask
            if (request.NewStatus == "Resolved")
            {
                assignedTask.Status = "Completed";
                assignedTask.CompletedAt = DateTime.UtcNow;
            }

            await _issueRepository.SaveChangesAsync(ct);

            return MapIssueToDto(issue);
        }

        private async Task<bool> HasAccessToIssueAsync(int issueId, int staffUserId, CancellationToken ct)
        {
            // Created by self?
            var isCreator = await _issueRepository.IsCreatorAsync(issueId, staffUserId, ct);
            if (isCreator) return true;

            // Assigned to self?
            var hasTask = await _staffTaskRepository.HasAssignedTaskAsync(issueId, staffUserId, ct);
            return hasTask;
        }

        public async Task<PagedResult<IssueDto>> GetIssuesForManagerAsync(
            IssueQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _issueRepository.GetIssuesForManagerPagedAsync(
                queryParams.Status,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            return new PagedResult<IssueDto>
            {
                Items = items.Select(MapIssueToDto),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<IssueDto> GetIssueByIdForManagerAsync(
            int issueId, CancellationToken ct = default)
        {
            var issue = await _issueRepository.GetIssueWithRelationsAsync(issueId, tracking: false, ct);
            if (issue == null)
            {
                throw new NotFoundException($"Issue with ID {issueId} not found.");
            }

            return MapIssueToDto(issue);
        }

        private static IssueDto MapIssueToDto(Issue issue)
        {
            var assignedTask = issue.StaffTasks?.FirstOrDefault();

            return new IssueDto
            {
                IssueId = issue.IssueId,
                StallId = issue.StallId,
                StallCode = issue.Stall?.Code ?? string.Empty,
                Title = issue.Title,
                Description = issue.Description,
                ImageUrl = issue.ImageUrl,
                Status = issue.Status ?? string.Empty,
                CreatedByUserId = issue.CreatedByUserId,
                CreatedByName = issue.CreatedByUser?.Name ?? string.Empty,
                CreatedAt = issue.CreatedAt,
                UpdatedAt = issue.UpdatedAt,
                AssignedTaskId = assignedTask?.TaskId,
                AssignedTaskStatus = assignedTask?.Status
            };
        }
    }
}
