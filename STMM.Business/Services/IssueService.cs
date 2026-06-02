using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Issue;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.UnitOfWork;
using DBTask = STMM.DataAccess.Entities.StaffTask;
namespace STMM.Business.Services
{
    public class IssueService : BaseService, IIssueService
    {
        private readonly IValidator<CreateIssueRequest> _createValidator;
        private readonly IValidator<UpdateIssueStatusRequest> _updateStatusValidator;

        // Valid state transitions (BR-50)
        private static readonly Dictionary<string, string> ValidTransitions = new()
        {
            { "Reported", "InProgress" },
            { "InProgress", "Resolved" }
        };

        public IssueService(
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateIssueRequest> createValidator,
            IValidator<UpdateIssueStatusRequest> updateStatusValidator)
            : base(unitOfWork, mapper)
        {
            _createValidator = createValidator;
            _updateStatusValidator = updateStatusValidator;
        }

        /// <inheritdoc />
        public async Task<PagedResult<IssueDto>> GetIssuesAsync(
            int staffUserId, IssueQueryParams queryParams, CancellationToken ct = default)
        {
            // Issue scope: do mình tạo HOẶC có task giao cho mình
            var assignedIssueIds = _unitOfWork.Repository<DBTask>()
                .Query()
                .Where(t => t.AssignedToUserId == staffUserId && t.IssueId != null)
                .Select(t => t.IssueId!.Value);

            var query = _unitOfWork.Repository<Issue>()
                .Query()
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .Where(i => i.CreatedByUserId == staffUserId || assignedIssueIds.Contains(i.IssueId));

            // Filter by status
            if (!string.IsNullOrWhiteSpace(queryParams.Status))
            {
                query = query.Where(i => i.Status == queryParams.Status);
            }

            var totalCount = await query.CountAsync(ct);

            // Sort
            query = queryParams.SortDescending
                ? query.OrderByDescending(i => i.CreatedAt)
                : query.OrderBy(i => i.CreatedAt);

            // Pagination
            var items = await query
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .AsNoTracking()
                .ToListAsync(ct);

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
            // Check scope: mình tạo hoặc có task giao cho mình
            var hasAccess = await HasAccessToIssueAsync(issueId, staffUserId, ct);
            if (!hasAccess)
            {
                throw new NotFoundException($"Không tìm thấy sự cố với Id = {issueId}.");
            }

            var issue = await _unitOfWork.Repository<Issue>()
                .Query()
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .AsNoTracking()
                .FirstOrDefaultAsync(i => i.IssueId == issueId, ct);

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

            // Check stall exists (BR-68)
            var stall = await _unitOfWork.Repository<Stall>()
                .Query()
                .FirstOrDefaultAsync(s => s.StallId == request.StallId && s.IsDeleted != true, ct);

            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp hàng với Id = {request.StallId}.");
            }

            // Create issue (BR-50: initial status = Reported)
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

            await _unitOfWork.Repository<Issue>().AddAsync(issue, ct);
            await _unitOfWork.SaveChangesAsync(ct);

            // Assign navigation for mapping
            issue.Stall = stall;

            // Reload CreatedByUser for DTO
            var user = await _unitOfWork.Repository<User>()
                .Query()
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == staffUserId, ct);
            issue.CreatedByUser = user!;

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

            // Authorization check: chỉ update issue có StaffTask giao cho mình (Decision 4)
            var assignedTask = await _unitOfWork.Repository<StaffTask>()
                .Query()
                .FirstOrDefaultAsync(t => t.IssueId == issueId && t.AssignedToUserId == staffUserId, ct);

            if (assignedTask == null)
            {
                throw new NotFoundException(
                    $"Bạn không được phân công xử lý sự cố Id = {issueId}.");
            }

            // Load issue (tracking)
            var issue = await _unitOfWork.Repository<Issue>()
                .Query()
                .Include(i => i.Stall)
                .Include(i => i.CreatedByUser)
                .Include(i => i.StaffTasks)
                .FirstOrDefaultAsync(i => i.IssueId == issueId, ct);

            if (issue == null)
            {
                throw new NotFoundException($"Không tìm thấy sự cố với Id = {issueId}.");
            }

            // Validate state transition (BR-50)
            var currentStatus = issue.Status ?? "Reported";
            if (!ValidTransitions.TryGetValue(currentStatus, out var expectedNext) ||
                expectedNext != request.NewStatus)
            {
                throw new BadRequestException(
                    $"Không thể chuyển trạng thái từ '{currentStatus}' sang '{request.NewStatus}'. " +
                    $"Chỉ cho phép: {currentStatus} → {expectedNext ?? "(kết thúc)"}.");
            }

            // Update issue
            issue.Status = request.NewStatus;
            issue.UpdatedAt = DateTime.UtcNow;

            // BR-59 + BR-57: Nếu Resolved → auto-update linked StaffTask
            if (request.NewStatus == "Resolved")
            {
                assignedTask.Status = "Completed";
                assignedTask.CompletedAt = DateTime.UtcNow;
            }

            await _unitOfWork.SaveChangesAsync(ct);

            return MapIssueToDto(issue);
        }

        private async Task<bool> HasAccessToIssueAsync(int issueId, int staffUserId, CancellationToken ct)
        {
            // Mình tạo?
            var isCreator = await _unitOfWork.Repository<Issue>()
                .Query()
                .AnyAsync(i => i.IssueId == issueId && i.CreatedByUserId == staffUserId, ct);

            if (isCreator) return true;

            // Có task giao cho mình?
            var hasTask = await _unitOfWork.Repository<StaffTask>()
                .Query()
                .AnyAsync(t => t.IssueId == issueId && t.AssignedToUserId == staffUserId, ct);

            return hasTask;
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
