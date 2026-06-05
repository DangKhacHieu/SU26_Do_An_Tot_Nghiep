using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Common;
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
        private readonly IMapper _mapper;
        private readonly IValidator<CreateTaskRequest> _createValidator;
        private readonly IValidator<UpdateTaskStatusRequest> _updateValidator;
        private readonly IValidator<CompleteTaskRequest> _completeValidator;
        private readonly INotificationService _notificationService;

        public StaffTaskService(
            IStaffTaskRepository staffTaskRepository,
            IUserRepository userRepository,
            IIssueRepository issueRepository,
            IRequestRepository requestRepository,
            IViolationRepository violationRepository,
            IStallRepository stallRepository,
            IMapper mapper,
            IValidator<CreateTaskRequest> createValidator,
            IValidator<UpdateTaskStatusRequest> updateValidator,
            IValidator<CompleteTaskRequest> completeValidator,
            INotificationService notificationService)
        {
            _staffTaskRepository = staffTaskRepository;
            _userRepository = userRepository;
            _issueRepository = issueRepository;
            _requestRepository = requestRepository;
            _violationRepository = violationRepository;
            _stallRepository = stallRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _completeValidator = completeValidator;
            _notificationService = notificationService;
        }

        /// <inheritdoc />
        public async Task<PagedResult<TaskSummaryDto>> GetTasksForManagerAsync(TaskQueryParams q, CancellationToken ct = default)
        {
            var (items, totalCount) = await _staffTaskRepository.GetTasksPagedAsync(
                staffUserId: q.AssignedToUserId,
                status: q.Status,
                taskType: q.TaskType,
                search: q.Search,
                pageNumber: q.PageNumber,
                pageSize: q.PageSize,
                ct: ct);

            return new PagedResult<TaskSummaryDto>
            {
                Items = _mapper.Map<IEnumerable<TaskSummaryDto>>(items),
                TotalCount = totalCount,
                PageNumber = q.PageNumber,
                PageSize = q.PageSize
            };
        }

        /// <inheritdoc />
        public async Task<PagedResult<TaskSummaryDto>> GetTasksForStaffAsync(int staffUserId, TaskQueryParams q, CancellationToken ct = default)
        {
            var (items, totalCount) = await _staffTaskRepository.GetTasksPagedAsync(
                staffUserId: staffUserId,
                status: q.Status,
                taskType: q.TaskType,
                search: q.Search,
                pageNumber: q.PageNumber,
                pageSize: q.PageSize,
                ct: ct);

            return new PagedResult<TaskSummaryDto>
            {
                Items = _mapper.Map<IEnumerable<TaskSummaryDto>>(items),
                TotalCount = totalCount,
                PageNumber = q.PageNumber,
                PageSize = q.PageSize
            };
        }

        /// <inheritdoc />
        public async Task<TaskDto> GetTaskByIdAsync(int taskId, CancellationToken ct = default)
        {
            var task = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            return _mapper.Map<TaskDto>(task);
        }

        /// <inheritdoc />
        public async Task<TaskDto> CreateTaskAsync(int managerUserId, CreateTaskRequest req, CancellationToken ct = default)
        {
            var validationResult = await _createValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Check if AssignedToUserId is active staff
            var isActiveStaff = await _userRepository.IsActiveStaffAsync(req.AssignedToUserId, ct);
            if (!isActiveStaff)
            {
                throw new NotFoundException($"Staff user with ID {req.AssignedToUserId} not found or is inactive.");
            }

            if (req.TaskType == "UtilityReading")
            {
                var localNow = DateTime.UtcNow.AddHours(7);
                var existingTasks = await _staffTaskRepository.FindAsync(t => 
                    t.AreaId == req.AreaId &&
                    t.TaskType == "UtilityReading" &&
                    t.CreatedAt.HasValue &&
                    t.CreatedAt.Value.Year == localNow.Year &&
                    t.CreatedAt.Value.Month == localNow.Month &&
                    t.Status != "Cancelled", ct);
                
                if (existingTasks.Any())
                {
                    throw new BadRequestException("Khu vực này đã được thiết lập tác vụ ghi số điện nước trong tháng này rồi.");
                }
            }

            string? imageBeforeUrl = null;

            if (req.IssueId.HasValue)
            {
                var issue = await _issueRepository.GetByIdAsync(req.IssueId.Value, ct);
                if (issue == null)
                {
                    throw new NotFoundException($"Issue with ID {req.IssueId.Value} not found.");
                }
                imageBeforeUrl = issue.ImageUrl;
            }
            else if (req.RequestId.HasValue)
            {
                var request = await _requestRepository.GetByIdAsync(req.RequestId.Value, ct);
                if (request == null)
                {
                    throw new NotFoundException($"Request with ID {req.RequestId.Value} not found.");
                }
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
            await _staffTaskRepository.SaveChangesAsync(ct);

            // Fetch loaded relations for DTO
            var createdTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(task.TaskId, ct);

            // Send Notification to Staff
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = "New Task Assigned",
                Content = $"You have been assigned a new task: {task.Title}",
                NotiType = "System",
                CreatedByUserId = managerUserId,
                TargetUserId = req.AssignedToUserId
            }, ct);

            return _mapper.Map<TaskDto>(createdTask!);
        }

        /// <inheritdoc />
        public async Task<TaskDto> UpdateTaskStatusAsync(int taskId, UpdateTaskStatusRequest req, CancellationToken ct = default)
        {
            var validationResult = await _updateValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var task = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            var oldStatus = task.Status ?? "Pending";
            var newStatus = req.NewStatus;

            bool isValid = false;
            if (oldStatus == "Pending" && newStatus == "Cancelled") isValid = true;
            else if (oldStatus == "PendingApproval" && newStatus == "In_Progress") isValid = true;
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
                        issue.Status = "Closed";
                        _issueRepository.Update(issue);
                    }
                }
                else if (task.RequestId.HasValue)
                {
                    var request = await _requestRepository.GetByIdAsync(task.RequestId.Value, ct);
                    if (request != null)
                    {
                        request.Status = "Rejected";
                        _requestRepository.Update(request);
                    }
                }
            }

            _staffTaskRepository.Update(task);
            await _staffTaskRepository.SaveChangesAsync(ct);

            var updatedTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(updatedTask!);
        }

        /// <inheritdoc />
        public async Task<TaskDto> CompleteTaskAsync(int staffUserId, int taskId, CompleteTaskRequest req, CancellationToken ct = default)
        {
            var validationResult = await _completeValidator.ValidateAsync(req, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var task = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            if (task.AssignedToUserId != staffUserId)
            {
                throw new BadRequestException("You are not assigned to complete this task.");
            }

            var currentStatus = task.Status ?? "Pending";
            if (currentStatus == "Completed" || currentStatus == "Cancelled")
            {
                throw new BadRequestException("Task is already completed or cancelled.");
            }

            if (task.TaskType == "UtilityReading")
            {
                if (!task.AreaId.HasValue)
                {
                    throw new BadRequestException("Utility reading task has no Area associated.");
                }

                var localToday = DateTime.UtcNow.AddHours(7).Date;

                var stallsInArea = await _stallRepository.GetStallsChecklistByAreaAsync(task.AreaId.Value, localToday.Year, localToday.Month, ct);

                var missingReadingsExist = stallsInArea.Any(s => !s.HasReadingThisMonth);

                if (missingReadingsExist)
                {
                    throw new BadRequestException("Không thể hoàn tất tác vụ. Vẫn còn sạp trong khu vực chưa được ghi chỉ số điện nước tháng này.");
                }
            }

            // Task type Repair and linked to Request/Issue must be in In_Progress status to complete
            if (task.TaskType == "Repair" && (task.RequestId.HasValue || task.IssueId.HasValue))
            {
                if (currentStatus != "In_Progress")
                {
                    throw new BadRequestException("Repair tasks linked to a Request or Issue must be in In_Progress status to be completed.");
                }
            }

            // ImageBeforeUrl validation:
            string? imageBefore = task.ImageBeforeUrl;
            if (!string.IsNullOrEmpty(req.ImageBeforeUrl))
            {
                imageBefore = req.ImageBeforeUrl;
            }

            if (task.TaskType == "Repair" || task.TaskType == "Maintenance")
            {
                if (string.IsNullOrEmpty(imageBefore))
                {
                    throw new BadRequestException("Image before repair/maintenance is required to complete the task.");
                }
            }

            // Update task status and images
            task.Status = "Completed";
            task.ImageBeforeUrl = imageBefore;
            task.ImageAfterUrl = req.ImageAfterUrl;
            task.CompletedAt = DateTime.UtcNow;

            if (!string.IsNullOrWhiteSpace(req.CompletionNotes))
            {
                task.Description = string.IsNullOrEmpty(task.Description)
                    ? $"Notes: {req.CompletionNotes}"
                    : $"{task.Description}\nNotes: {req.CompletionNotes}";
            }

            // Auto-link updates
            if (task.IssueId.HasValue)
            {
                var issue = await _issueRepository.GetByIdAsync(task.IssueId.Value, ct);
                if (issue != null)
                {
                    issue.Status = "Resolved";
                    _issueRepository.Update(issue);
                }
            }
            else if (task.RequestId.HasValue)
            {
                var request = await _requestRepository.GetByIdAsync(task.RequestId.Value, ct);
                if (request != null)
                {
                    request.Status = "Completed";
                    _requestRepository.Update(request);
                }
            }

            _staffTaskRepository.Update(task);
            await _staffTaskRepository.SaveChangesAsync(ct);

            // Send notification to Manager role
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = "Task Completed",
                Content = $"Task \"{task.Title}\" has been completed by staff.",
                NotiType = "System",
                CreatedByUserId = staffUserId,
                TargetRole = "Manager"
            }, ct);

            var completedTask = await _staffTaskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(completedTask!);
        }

        /// <inheritdoc />
        public async Task<List<UtilityStallChecklistDto>> GetStallsForUtilityTaskAsync(int taskId, int staffUserId, CancellationToken ct = default)
        {
            var task = await _staffTaskRepository.GetByIdAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            if (task.AssignedToUserId != staffUserId)
            {
                throw new BadRequestException("You are not assigned to this task.");
            }

            if (task.TaskType != "UtilityReading" || !task.AreaId.HasValue)
            {
                throw new BadRequestException("This task is not a utility reading task or has no Area associated.");
            }

            var localToday = DateTime.UtcNow.AddHours(7).Date;

            var results = await _stallRepository.GetStallsChecklistByAreaAsync(task.AreaId.Value, localToday.Year, localToday.Month, ct);

            return results.Select(r => new UtilityStallChecklistDto
            {
                StallId = r.StallId,
                StallCode = r.StallCode,
                StallStatus = r.StallStatus,
                HasReadingThisMonth = r.HasReadingThisMonth
            }).ToList();
        }
    }
}
