using FluentValidation;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Issue;
using STMM.Business.DTOs.Notification;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class IssueService : IIssueService
    {
        private readonly IIssueRepository _issueRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;
        private readonly IFileUploadService _fileUploadService;
        private readonly IValidator<CreateIssueRequest> _createValidator;
        private readonly ILogger<IssueService> _logger;

        public IssueService(
            IIssueRepository issueRepository,
            IStallRepository stallRepository,
            IUserRepository userRepository,
            INotificationService notificationService,
            IFileUploadService fileUploadService,
            IValidator<CreateIssueRequest> createValidator,
            ILogger<IssueService> logger)
        {
            _issueRepository = issueRepository;
            _stallRepository = stallRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
            _fileUploadService = fileUploadService;
            _createValidator = createValidator;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<IssueDto>> GetIssuesAsync(
            int staffUserId,
            CancellationToken ct = default)
        {
            var items = await _issueRepository.GetIssuesForStaffAsync(staffUserId, ct);
            return items.Select(MapIssueToDto).ToList();
        }

        public async Task<IEnumerable<STMM.Business.DTOs.StallTask.StaffStallLookupDto>> GetIssueStallsLookupAsync(
            int staffUserId,
            string? search,
            CancellationToken ct = default)
        {
            var marketId = await GetMarketIdAsync(staffUserId, "staff", ct);
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var items = await _stallRepository.GetStaffIssueStallLookupAsync(marketId, search, 50, effectiveDate, ct);
            return items.Select(x => new STMM.Business.DTOs.StallTask.StaffStallLookupDto
            {
                StallId = x.StallId,
                StallCode = x.StallCode,
                AreaName = x.AreaName,
                VendorName = x.VendorName
            });
        }

        /// <inheritdoc />
        public async Task<IssueDto> GetIssueByIdAsync(
            int issueId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var issue = await _issueRepository.GetIssueForStaffAsync(issueId, staffUserId, ct)
                ?? throw new NotFoundException($"Issue with ID {issueId} not found.");

            return MapIssueToDto(issue);
        }

        /// <inheritdoc />
        public async Task<IssueDto> CreateIssueAsync(
            int staffUserId,
            CreateIssueRequest request,
            CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(error => error.ErrorMessage)));
            }

            var marketId = await GetMarketIdAsync(staffUserId, "staff", ct);
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var stall = await _stallRepository.GetEligibleIssueStallForMarketAsync(request.StallId, marketId, effectiveDate, ct)
                ?? throw new NotFoundException($"Stall with ID {request.StallId} not found.");

            var uploadedUrls = await _fileUploadService.UploadImagesAsync(request.Images, "issues", maxFiles: 3, ct: ct);
            var imageUrlString = uploadedUrls.Count > 0 ? string.Join(";", uploadedUrls) : null;

            var issue = new Issue
            {
                StallId = request.StallId,
                CreatedByUserId = staffUserId,
                Title = request.Title,
                Description = request.Description,
                ImageUrl = imageUrlString,
                Status = "Reported",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            try
            {
                await _issueRepository.AddAsync(issue, ct);
                await _issueRepository.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database save failed for issue. Cleaning up uploaded Cloudinary images.");
                await _fileUploadService.DeleteImagesAsync(uploadedUrls, ct);
                throw;
            }

            var managers = await _userRepository.GetActiveManagersByMarketAsync(marketId, ct);
            foreach (var manager in managers)
            {
                await TryNotifyManagerAsync(issue, stall.Code, manager.UserId, staffUserId, ct);
            }

            issue.Stall = stall;
            var users = await _userRepository.FindAsync(user => user.UserId == staffUserId, ct);
            issue.CreatedByUser = users.FirstOrDefault()!;

            return MapIssueToDto(issue);
        }

        /// <inheritdoc />
        public async Task<PagedResult<IssueDto>> GetIssuesForManagerAsync(
            int? managerUserId,
            IssueQueryParams queryParams,
            CancellationToken ct = default)
        {
            int? marketId = null;
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    return new PagedResult<IssueDto>
                    {
                        Items = new List<IssueDto>(),
                        TotalCount = 0,
                        PageNumber = queryParams.PageNumber,
                        PageSize = queryParams.PageSize
                    };
                }
                marketId = manager?.MarketId;
            }

            var (items, totalCount) = await _issueRepository.GetIssuesForManagerPagedAsync(
                marketId,
                queryParams.Status,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            return BuildPagedResult(items, totalCount, queryParams);
        }

        /// <inheritdoc />
        public async Task<IssueDto> GetIssueByIdForManagerAsync(
            int? managerUserId,
            int issueId,
            CancellationToken ct = default)
        {
            int? marketId = null;
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    throw new NotFoundException($"Issue with ID {issueId} not found.");
                }
                marketId = manager?.MarketId;
            }

            var issue = await _issueRepository.GetIssueForManagerAsync(issueId, marketId, ct)
                ?? throw new NotFoundException($"Issue with ID {issueId} not found.");

            return MapIssueToDto(issue);
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

        private async Task TryNotifyManagerAsync(
            Issue issue,
            string stallCode,
            int managerUserId,
            int staffUserId,
            CancellationToken ct)
        {
            try
            {
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = "New Issue Reported",
                    Content = $"Issue #{issue.IssueId} - {issue.Title} was reported for stall {stallCode}.",
                    NotiType = "Issue",
                    CreatedByUserId = staffUserId,
                    TargetUserId = managerUserId
                }, ct);
            }
            catch (Exception exception)
            {
                _logger.LogError(
                    exception,
                    "Unable to notify manager {ManagerUserId} about issue {IssueId}.",
                    managerUserId,
                    issue.IssueId);
            }
        }

        private static PagedResult<IssueDto> BuildPagedResult(
            IEnumerable<Issue> items,
            int totalCount,
            IssueQueryParams queryParams)
        {
            return new PagedResult<IssueDto>
            {
                Items = items.Select(MapIssueToDto),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
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
