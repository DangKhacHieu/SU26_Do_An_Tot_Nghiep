using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Task;
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
    public class StaffTaskService : IStaffTaskService
    {
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly IUserRepository _userRepository;
        private readonly IIssueRepository _issueRepository;
        private readonly IRequestRepository _requestRepository;
        private readonly IViolationRepository _violationRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IAreaRepository _areaRepository;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;
        private readonly IFileUploadService _fileUploadService;
        private readonly IValidator<CreateTaskRequest> _createValidator;
        private readonly IValidator<UpdateTaskStatusRequest> _updateValidator;
        private readonly IValidator<CompleteTaskRequest> _completeValidator;
        private readonly ILogger<StaffTaskService> _logger;
        public StaffTaskService(
            IStaffTaskRepository staffTaskRepository,
            IUserRepository userRepository,
            IIssueRepository issueRepository,
            IRequestRepository requestRepository,
            IViolationRepository violationRepository,
            IStallRepository stallRepository,
            IAreaRepository areaRepository,
            INotificationService notificationService,
            IMapper mapper,
            IFileUploadService fileUploadService,
            IValidator<CreateTaskRequest> createValidator,
            IValidator<UpdateTaskStatusRequest> updateValidator,
            IValidator<CompleteTaskRequest> completeValidator,
            ILogger<StaffTaskService> logger)
        {
            _staffTaskRepository = staffTaskRepository;
            _userRepository = userRepository;
            _issueRepository = issueRepository;
            _requestRepository = requestRepository;
            _violationRepository = violationRepository;
            _stallRepository = stallRepository;
            _areaRepository = areaRepository;
            _notificationService = notificationService;
            _mapper = mapper;
            _fileUploadService = fileUploadService;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _completeValidator = completeValidator;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<TaskSummaryDto>> GetTasksForManagerAsync(
            int? managerUserId,
            CancellationToken ct = default)
        {
            // F-01: một điều kiện duy nhất qua GetManagerMarketIdAsync, giống GetTaskByIdForManagerAsync.
            // Bỏ fallback GetByIdAsync vì nó không lọc IsDeleted -> tài khoản Manager đã xoá mềm
            // vẫn đọc được toàn bộ công việc của chợ.
            if (!managerUserId.HasValue)
            {
                throw new ForbiddenException("The manager account is not assigned to a market.");
            }

            var marketId = await GetManagerMarketIdAsync(managerUserId.Value, ct);
            var items = await _staffTaskRepository.GetTasksForMarketAsync(marketId, ct);
            return _mapper.Map<List<TaskSummaryDto>>(items);
        }

        /// <inheritdoc />
        public async Task<IReadOnlyList<TaskSummaryDto>> GetTasksForStaffAsync(int staffUserId, CancellationToken ct = default)
        {
            var items = await _staffTaskRepository.GetTasksForStaffAsync(staffUserId, ct);
            var dtos = _mapper.Map<List<TaskSummaryDto>>(items);

            var utilityTasks = dtos.Where(t => t.TaskType == "UtilityReading" && t.AreaId.HasValue).ToList();
            var areaStallsDict = new Dictionary<int, List<int>>();

            if (utilityTasks.Any())
            {
                var uniqueAreaIds = utilityTasks.Select(t => t.AreaId!.Value).Distinct();
                var localToday = DateTime.UtcNow.AddHours(7);
                var effectiveDate = DateOnly.FromDateTime(localToday);

                foreach (var areaId in uniqueAreaIds)
                {
                    var stallsInArea = await _stallRepository.GetStallsChecklistByAreaAsync(
                        areaId, effectiveDate, localToday.Year, localToday.Month, ct);

                    areaStallsDict[areaId] = stallsInArea
                        .Where(s => s.HasElectricityMeter || s.HasWaterMeter)
                        .Select(s => s.StallId)
                        .ToList();
                }
            }

            foreach (var task in dtos)
            {
                if (task.TaskType == "UtilityReading" && task.AreaId.HasValue)
                {
                    task.RelatedStallIds = areaStallsDict.GetValueOrDefault(task.AreaId.Value, new List<int>());
                }
                else if (task.StallId.HasValue)
                {
                    task.RelatedStallIds = new List<int> { task.StallId.Value };
                }
            }

            return dtos;
        }

        /// <inheritdoc />
        public async Task<TaskDto> GetTaskByIdForManagerAsync(int taskId, int? managerUserId, CancellationToken ct = default)
        {
            // Every path must stay market-scoped. The previous fall-through to an unscoped
            // GetTaskByIdWithRelationsAsync leaked tasks from other markets whenever the manager
            // record could not be resolved.
            if (!managerUserId.HasValue)
            {
                throw new ForbiddenException("The manager account is not assigned to a market.");
            }

            var marketId = await GetManagerMarketIdAsync(managerUserId.Value, ct);

            var task = await _staffTaskRepository.GetTaskByIdForMarketAsync(taskId, marketId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            return _mapper.Map<TaskDto>(task);
        }

        /// <inheritdoc />
        public async Task<TaskDto> GetTaskByIdForStaffAsync(int taskId, int staffUserId, CancellationToken ct = default)
        {
            var task = await _staffTaskRepository.GetTaskByIdForStaffAsync(taskId, staffUserId, includeMaterials: true, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            return _mapper.Map<TaskDto>(task);
        }

        /// <inheritdoc />
        public async Task<TaskDto> CreateTaskAsync(int managerUserId, CreateTaskRequest req, CancellationToken ct = default)
        {
            var marketId = await GetManagerMarketIdAsync(managerUserId, ct);
            var validationResult = await _createValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            await GetActiveStaffInMarketAsync(req.AssignedToUserId, marketId, ct);

            if (req.AreaId.HasValue)
            {
                await EnsureAreaInMarketAsync(req.AreaId.Value, marketId, "Area", ct);
            }

            if (req.TaskType == "UtilityReading")
            {
                var localNow = DateTime.UtcNow.AddHours(7);
                var periodStartUtc = new DateTime(
                    localNow.Year,
                    localNow.Month,
                    1,
                    0,
                    0,
                    0,
                    DateTimeKind.Utc).AddHours(-7);
                var periodEndUtc = periodStartUtc.AddMonths(1);

                if (await _staffTaskRepository.HasUtilityTaskForAreaInPeriodAsync(
                        req.AreaId!.Value,
                        periodStartUtc,
                        periodEndUtc,
                        ct))
                {
                    throw new BadRequestException("A utility reading task already exists for this area in the current month.");
                }

                var effectiveDate = DateOnly.FromDateTime(localNow);
                var stalls = await _stallRepository.GetStallsChecklistByAreaAsync(
                    req.AreaId.Value,
                    effectiveDate,
                    localNow.Year,
                    localNow.Month,
                    ct);
                EnsureUtilityAreaIsReady(stalls);

                if (stalls.All(stall => stall.HasReadingThisMonth))
                {
                    throw new BadRequestException(
                        "All stalls in this area have already had their utility meters read this month.");
                }
            }

            string? imageBeforeUrl = null;
            Issue? linkedIssue = null;

            if (req.IssueId.HasValue)
            {
                var issue = await _issueRepository.GetIssueWithRelationsAsync(req.IssueId.Value, tracking: true, ct: ct);
                if (issue == null)
                {
                    throw new NotFoundException($"Issue with ID {req.IssueId.Value} not found.");
                }
                await EnsureAreaInMarketAsync(issue.Stall.AreaId, marketId, "Issue", ct);
                imageBeforeUrl = issue.ImageUrl;
                linkedIssue = issue;
                if (await _staffTaskRepository.HasActiveTaskForIssueAsync(issue.IssueId, ct))
                    throw new BadRequestException("An active task already exists for this issue.");
            }
            else if (req.RequestId.HasValue)
            {
                var request = await _requestRepository.GetRequestWithRelationsAsync(req.RequestId.Value, tracking: true, ct: ct);
                if (request == null)
                {
                    throw new NotFoundException($"Request with ID {req.RequestId.Value} not found.");
                }
                await EnsureAreaInMarketAsync(request.Stall.AreaId, marketId, "Request", ct);
                if (await _staffTaskRepository.HasActiveTaskForRequestAsync(request.RequestId, ct))
                    throw new BadRequestException("An active task already exists for this request.");
                if (request.RequestType == "ViolationAppeal" && request.ViolationId.HasValue)
                {
                    var violation = await _violationRepository.GetByIdAsync(request.ViolationId.Value, ct);
                    imageBeforeUrl = violation?.ImageUrl;
                }
            }

            var task = new StaffTask
            {
                AssignedToUserId = req.AssignedToUserId,
                RequestId = req.RequestId,
                IssueId = req.IssueId,
                AreaId = req.AreaId,
                TaskType = req.TaskType,
                Title = req.Title,
                Description = req.Description,
                Status = "Pending",
                ImageBeforeUrl = imageBeforeUrl,
                CreatedAt = DateTime.UtcNow
            };

            await _staffTaskRepository.AddAsync(task, ct);
            if (linkedIssue?.Status == "Reported")
                linkedIssue.Status = "InProgress";
            try
            {
                await _staffTaskRepository.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex) when (IsActiveSourceUniqueViolation(ex))
            {
                throw new BadRequestException(
                    req.IssueId.HasValue
                        ? "An active task already exists for this issue."
                        : "An active task already exists for this request.");
            }

            await NotifyStaffAsync(
                req.AssignedToUserId,
                managerUserId,
                "New Task Assigned",
                $"Task #{task.TaskId} - {task.Title} has been assigned to you.",
                ct);

            var createdTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(task.TaskId, ct);

            return _mapper.Map<TaskDto>(createdTask!);
        }

        /// <inheritdoc />
        public async Task<TaskDto> UpdateTaskStatusAsync(int managerUserId, int taskId, UpdateTaskStatusRequest req, CancellationToken ct = default)
        {
            var marketId = await GetManagerMarketIdAsync(managerUserId, ct);
            var task = await _staffTaskRepository.GetTaskByIdForMarketAsync(taskId, marketId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            var validationResult = await _updateValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var oldStatus = task.Status ?? "Pending";
            var newStatus = req.NewStatus;

            // Only the approve / return-for-revision decisions are reserved for the vendor when the
            // vendor is paying. Cancelling stays the manager's call, otherwise a vendor-paid task
            // would be stuck in PendingApproval forever with no way out.
            if (oldStatus == "PendingApproval" && task.RequestId.HasValue && newStatus != "Cancelled")
            {
                var request = await _requestRepository.GetByIdAsync(task.RequestId.Value, ct);
                if (request == null || request.PaidBy != "Market")
                {
                    throw new BadRequestException("The quotation for this linked repair request must be approved by the vendor online.");
                }

                if (newStatus == "In_Progress")
                {
                    request.IsQuoteApproved = true;
                    request.Status = "Approved";
                    request.QuotationAmount = task.ActualCost;
                    request.UpdatedAt = DateTime.UtcNow;
                    _requestRepository.Update(request);
                }
                else if (newStatus == "Pending")
                {
                    request.IsQuoteApproved = false;
                    request.Status = "Pending";
                    request.UpdatedAt = DateTime.UtcNow;
                    _requestRepository.Update(request);
                }
            }

            bool isValid = false;
            if (oldStatus == "Pending" && newStatus == "Cancelled") isValid = true;
            else if (oldStatus == "PendingApproval" && newStatus == "In_Progress") isValid = true;
            else if (oldStatus == "PendingApproval" && newStatus == "Pending") isValid = true;
            else if (oldStatus == "PendingApproval" && newStatus == "Cancelled") isValid = true;
            else if (oldStatus == "In_Progress" && newStatus == "Cancelled") isValid = true;

            if (!isValid)
            {
                throw new BadRequestException($"Invalid transition from {oldStatus} to {newStatus}.");
            }

            task.Status = newStatus;

            if (newStatus == "Cancelled")
            {
                if (task.IssueId.HasValue)
                {
                    var issue = await _issueRepository.GetByIdAsync(task.IssueId.Value, ct);
                    if (issue != null)
                    {
                        issue.Status = "Reported";
                        _issueRepository.Update(issue);
                    }
                }
                else if (task.RequestId.HasValue)
                {
                    var request = await _requestRepository.GetByIdAsync(task.RequestId.Value, ct);
                    if (request != null)
                    {
                        request.Status = "Rejected";
                        if (oldStatus == "PendingApproval")
                        {
                            request.IsQuoteApproved = false;
                        }
                        request.UpdatedAt = DateTime.UtcNow;
                        _requestRepository.Update(request);
                    }
                }
            }

            _staffTaskRepository.Update(task);
            await _staffTaskRepository.SaveChangesAsync(ct);

            if (newStatus == "Cancelled")
            {
                await NotifyStaffAsync(
                    task.AssignedToUserId,
                    managerUserId,
                    "Task Cancelled",
                    $"Task #{task.TaskId} - {task.Title} has been cancelled.",
                    ct);
            }

            var updatedTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(updatedTask!);
        }

        /// <inheritdoc />
        public async Task<TaskDto> CompleteTaskAsync(int staffUserId, int taskId, CompleteTaskRequest req, CancellationToken ct = default)
        {
            var task = await _staffTaskRepository.GetTaskByIdForStaffAsync(taskId, staffUserId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            var validationResult = await _completeValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var currentStatus = task.Status ?? "Pending";
            if (currentStatus == "Completed" || currentStatus == "Cancelled")
            {
                throw new BadRequestException("Task is already completed or cancelled.");
            }

            if (currentStatus == "PendingApproval")
            {
                throw new BadRequestException("The quotation for this task must be resolved before it can be completed.");
            }

            if (task.TaskType == "UtilityReading")
            {
                if (!task.AreaId.HasValue)
                {
                    throw new BadRequestException("Utility reading task has no Area associated.");
                }

                var localToday = DateTime.UtcNow.AddHours(7);
                var effectiveDate = DateOnly.FromDateTime(localToday);
                var stallsInArea = await _stallRepository.GetStallsChecklistByAreaAsync(
                    task.AreaId.Value,
                    effectiveDate,
                    localToday.Year,
                    localToday.Month,
                    ct);

                if (stallsInArea.Count == 0)
                {
                    throw new BadRequestException("This area has no stalls with an effective rental contract.");
                }

                // Meter availability is only enforced when the task is created. Re-checking it here
                // would strand the task if a meter was unassigned or deactivated mid-period, so a
                // stall only blocks completion for the meters it still has.
                if (stallsInArea.Any(s => (s.HasElectricityMeter && !s.HasElectricityReadingThisMonth)
                                       || (s.HasWaterMeter && !s.HasWaterReadingThisMonth)))
                {
                    throw new BadRequestException("This task cannot be completed while stalls are missing utility readings for the current month.");
                }
            }

            if (task.TaskType == "UtilityReading" && (req.ImageBefore != null || req.ImageAfter != null))
            {
                throw new BadRequestException("Utility reading tasks do not accept completion evidence images.");
            }

            string? uploadedBeforeUrl = null;
            string? uploadedAfterUrl = null;

            if (req.ImageBefore != null)
            {
                uploadedBeforeUrl = await _fileUploadService.UploadImageAsync(req.ImageBefore, "task-evidence", ct);
            }

            if (req.ImageAfter != null)
            {
                uploadedAfterUrl = await _fileUploadService.UploadImageAsync(req.ImageAfter, "task-evidence", ct);
            }

            string? imageBefore = task.ImageBeforeUrl ?? uploadedBeforeUrl;
            string? imageAfter = task.ImageAfterUrl ?? uploadedAfterUrl;

            if (task.TaskType == "Repair")
            {
                if (string.IsNullOrEmpty(imageBefore) || string.IsNullOrEmpty(imageAfter))
                {
                    await CleanupTaskImagesAsync(uploadedBeforeUrl, uploadedAfterUrl, ct);
                    throw new BadRequestException("Before and after images are required to complete a repair task.");
                }
            }

            task.Status = "Completed";
            task.ImageBeforeUrl = imageBefore;
            task.ImageAfterUrl = imageAfter;
            task.CompletedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.CompletionNotes))
            {
                task.Description = string.IsNullOrEmpty(task.Description)
                    ? $"Notes: {req.CompletionNotes}"
                    : $"{task.Description}\nNotes: {req.CompletionNotes}";
            }

            if (task.IssueId.HasValue)
            {
                if (task.Issue == null)
                {
                    _logger.LogError("Task {TaskId} references missing issue {IssueId}.", task.TaskId, task.IssueId.Value);
                    await CleanupTaskImagesAsync(uploadedBeforeUrl, uploadedAfterUrl, ct);
                    throw new InvalidOperationException($"Task {task.TaskId} has a missing linked issue.");
                }

                task.Issue.Status = "Resolved";
                _issueRepository.Update(task.Issue);
            }
            else if (task.RequestId.HasValue)
            {
                if (task.Request == null)
                {
                    _logger.LogError("Task {TaskId} references missing request {RequestId}.", task.TaskId, task.RequestId.Value);
                    await CleanupTaskImagesAsync(uploadedBeforeUrl, uploadedAfterUrl, ct);
                    throw new InvalidOperationException($"Task {task.TaskId} has a missing linked request.");
                }

                task.Request.Status = "Completed";
                task.Request.UpdatedAt = DateTime.UtcNow;
            }

            try
            {
                _staffTaskRepository.Update(task);
                await _staffTaskRepository.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save Task completion status. Cleaning up uploaded task evidence images.");
                await CleanupTaskImagesAsync(uploadedBeforeUrl, uploadedAfterUrl, ct);
                throw;
            }

            return _mapper.Map<TaskDto>(task);
        }

        private async Task CleanupTaskImagesAsync(string? beforeUrl, string? afterUrl, CancellationToken ct)
        {
            if (!string.IsNullOrEmpty(beforeUrl)) await _fileUploadService.DeleteImageAsync(beforeUrl, ct);
            if (!string.IsNullOrEmpty(afterUrl)) await _fileUploadService.DeleteImageAsync(afterUrl, ct);
        }

        public async Task<List<UtilityStallChecklistDto>> GetStallsForUtilityTaskForManagerAsync(int taskId, int? managerUserId, CancellationToken ct = default)
        {
            var taskDto = await GetTaskByIdForManagerAsync(taskId, managerUserId, ct);
            if (taskDto == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            if (taskDto.TaskType != "UtilityReading" || !taskDto.AreaId.HasValue)
            {
                throw new BadRequestException("This task is not a utility reading task or has no Area associated.");
            }

            var localToday = DateTime.UtcNow.AddHours(7);
            var effectiveDate = DateOnly.FromDateTime(localToday);
            var results = await _stallRepository.GetStallsChecklistByAreaAsync(
                taskDto.AreaId.Value,
                effectiveDate,
                localToday.Year,
                localToday.Month,
                ct);

            return results.Select(r => new UtilityStallChecklistDto
            {
                StallId = r.StallId,
                StallCode = r.StallCode,
                StallStatus = r.StallStatus,
                HasElectricityMeter = r.HasElectricityMeter,
                HasWaterMeter = r.HasWaterMeter,
                HasElectricityReadingThisMonth = r.HasElectricityReadingThisMonth,
                HasWaterReadingThisMonth = r.HasWaterReadingThisMonth,
                HasReadingThisMonth = r.HasReadingThisMonth
            }).ToList();
        }

        /// <inheritdoc />
        public async Task<List<UtilityStallChecklistDto>> GetStallsForUtilityTaskAsync(int taskId, int staffUserId, CancellationToken ct = default)
        {
            var task = await _staffTaskRepository.GetTaskByIdForStaffAsync(taskId, staffUserId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            if (task.TaskType != "UtilityReading" || !task.AreaId.HasValue)
            {
                throw new BadRequestException("This task is not a utility reading task or has no Area associated.");
            }

            var localToday = DateTime.UtcNow.AddHours(7);
            var effectiveDate = DateOnly.FromDateTime(localToday);
            var results = await _stallRepository.GetStallsChecklistByAreaAsync(
                task.AreaId.Value,
                effectiveDate,
                localToday.Year,
                localToday.Month,
                ct);

            return results.Select(r => new UtilityStallChecklistDto
            {
                StallId = r.StallId,
                StallCode = r.StallCode,
                StallStatus = r.StallStatus,
                HasElectricityMeter = r.HasElectricityMeter,
                HasWaterMeter = r.HasWaterMeter,
                HasElectricityReadingThisMonth = r.HasElectricityReadingThisMonth,
                HasWaterReadingThisMonth = r.HasWaterReadingThisMonth,
                HasReadingThisMonth = r.HasReadingThisMonth
            }).ToList();
        }

        /// <inheritdoc />
        public async Task<TaskDto> AssignTaskAsync(int managerUserId, int taskId, int staffUserId, CancellationToken ct = default)
        {
            var marketId = await GetManagerMarketIdAsync(managerUserId, ct);
            var task = await _staffTaskRepository.GetTaskByIdForMarketAsync(taskId, marketId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            if (task.Status is "Completed" or "Cancelled")
            {
                throw new BadRequestException("Completed or cancelled tasks cannot be reassigned.");
            }

            await GetActiveStaffInMarketAsync(staffUserId, marketId, ct);

            var previousStaffUserId = task.AssignedToUserId;
            if (previousStaffUserId == staffUserId)
            {
                return _mapper.Map<TaskDto>(task);
            }

            task.AssignedToUserId = staffUserId;
            _staffTaskRepository.Update(task);
            await _staffTaskRepository.SaveChangesAsync(ct);

            await NotifyStaffAsync(
                previousStaffUserId,
                managerUserId,
                "Task Assignment Removed",
                $"Task #{task.TaskId} - {task.Title} is no longer assigned to you.",
                ct);

            await NotifyStaffAsync(
                staffUserId,
                managerUserId,
                "New Task Assigned",
                $"Task #{task.TaskId} - {task.Title} has been assigned to you.",
                ct);

            var updatedTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(updatedTask!);
        }

        private async Task NotifyStaffAsync(
            int staffUserId,
            int managerUserId,
            string title,
            string content,
            CancellationToken ct)
        {
            try
            {
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = title,
                    Content = content,
                    NotiType = "Task",
                    CreatedByUserId = managerUserId,
                    TargetUserId = staffUserId
                }, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Could not send task notification to user {UserId}.",
                    staffUserId);
            }
        }

        private static bool IsActiveSourceUniqueViolation(DbUpdateException exception)
        {
            if (exception.InnerException is not PostgresException postgres ||
                postgres.SqlState != PostgresErrorCodes.UniqueViolation)
            {
                return false;
            }

            return postgres.ConstraintName is "ux_staff_tasks_active_issue" or "ux_staff_tasks_active_request";
        }

        private static void EnsureUtilityAreaIsReady(IReadOnlyCollection<StallChecklistQueryResult> stalls)
        {
            if (stalls.Count == 0)
            {
                throw new BadRequestException("This area has no stalls with an effective rental contract.");
            }

            var missingMeters = stalls
                .Where(stall => !stall.HasElectricityMeter || !stall.HasWaterMeter)
                .Select(stall =>
                {
                    var missingTypes = new List<string>();
                    if (!stall.HasElectricityMeter) missingTypes.Add("Electricity");
                    if (!stall.HasWaterMeter) missingTypes.Add("Water");
                    return $"{stall.StallCode} ({string.Join(" and ", missingTypes)})";
                })
                .ToList();

            if (missingMeters.Count > 0)
            {
                throw new BadRequestException(
                    $"Active utility meters are missing for: {string.Join(", ", missingMeters)}.");
            }
        }

        private async Task<int> GetManagerMarketIdAsync(int managerUserId, CancellationToken ct)
        {
            var manager = await _userRepository.GetUserByIdWithRoleAsync(managerUserId, ct);
            if (manager?.MarketId == null)
            {
                throw new ForbiddenException("The manager account is not assigned to a market.");
            }

            return manager.MarketId.Value;
        }

        private async Task<User> GetActiveStaffInMarketAsync(int staffUserId, int marketId, CancellationToken ct)
        {
            var staff = await _userRepository.GetUserByIdWithRoleAsync(staffUserId, ct);
            var isActiveStaff = staff != null
                && string.Equals(staff.Role?.Name, "Staff", StringComparison.OrdinalIgnoreCase)
                && string.Equals(staff.Status, "Active", StringComparison.OrdinalIgnoreCase)
                && staff.IsDeleted != true
                && staff.MarketId == marketId;

            if (!isActiveStaff)
            {
                throw new NotFoundException($"Staff user with ID {staffUserId} not found or is unavailable in this market.");
            }

            return staff!;
        }

        private async Task EnsureAreaInMarketAsync(int areaId, int marketId, string resourceName, CancellationToken ct)
        {
            var area = await _areaRepository.GetAreaByIdAsync(areaId, ct);
            if (area?.MarketId != marketId)
            {
                throw new NotFoundException($"{resourceName} was not found in this market.");
            }
        }
    }
}
