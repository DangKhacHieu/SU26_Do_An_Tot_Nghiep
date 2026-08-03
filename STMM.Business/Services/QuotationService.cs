using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Quotation;
using STMM.Business.DTOs.Task;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class QuotationService : IQuotationService
    {
        private readonly IStaffTaskRepository _taskRepository;
        private readonly ITaskMaterialRepository _materialRepository;
        private readonly IRepairPriceRepository _repairPriceRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;
        private readonly IValidator<AddMaterialRequest> _addMaterialValidator;
        private readonly IMapper _mapper;
        private readonly ILogger<QuotationService> _logger;

        public QuotationService(
            IStaffTaskRepository taskRepository,
            ITaskMaterialRepository materialRepository,
            IRepairPriceRepository repairPriceRepository,
            IUserRepository userRepository,
            INotificationService notificationService,
            IValidator<AddMaterialRequest> addMaterialValidator,
            IMapper mapper,
            ILogger<QuotationService> logger)
        {
            _taskRepository = taskRepository;
            _materialRepository = materialRepository;
            _repairPriceRepository = repairPriceRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
            _addMaterialValidator = addMaterialValidator;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<RepairPriceDto>> GetRepairPricesAsync(
            int userId,
            CancellationToken ct = default)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException("The account is not assigned to a market.");
            }

            var prices = await _repairPriceRepository.GetActiveForMarketAsync(user.MarketId.Value, ct);

            return prices
                .Select(MapRepairPriceToDto)
                .ToList();
        }

        public async Task<QuotationSummaryDto> GetQuotationAsync(
            int taskId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, staffUserId, ct);
            EnsureRepairQuotationSource(task);

            var materials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, materials);
        }

        public async Task<QuotationSummaryDto> AddMaterialAsync(
            int taskId,
            int staffUserId,
            AddMaterialRequest request,
            CancellationToken ct = default)
        {
            await ValidateMaterialRequestAsync(request, ct);

            var task = await LoadTaskOrThrowAsync(taskId, staffUserId, ct);
            EnsureRepairQuotationSource(task);
            EnsureTaskIsPending(task, "add material to");

            var marketId = task.AssignedToUser?.MarketId
                ?? (await _userRepository.GetUserByIdWithRoleAsync(staffUserId, ct))?.MarketId
                ?? throw new ForbiddenException("The account is not assigned to a market.");

            var repairPrice = await LoadRepairPriceOrThrowAsync(request.RepairPriceId, marketId, ct);
            var unitPrice = ResolveUnitPrice(repairPrice, request);
            var materials = await _materialRepository.GetByTaskIdForUpdateAsync(taskId, ct);
            var existingMaterial = materials.FirstOrDefault(material =>
                material.RepairPriceId == request.RepairPriceId &&
                material.UnitPrice == unitPrice);

            if (existingMaterial == null)
            {
                var material = CreateTaskMaterial(taskId, repairPrice, request, unitPrice);
                await _materialRepository.AddAsync(material, ct);
                materials.Add(material);
            }
            else
            {
                existingMaterial.Quantity += request.Quantity;
                existingMaterial.Amount = (decimal)existingMaterial.Quantity * existingMaterial.UnitPrice;
            }

            await _materialRepository.SaveChangesAsync(ct);
            return BuildQuotationSummary(task, materials);
        }

        public async Task<QuotationSummaryDto> RemoveMaterialAsync(
            int taskId,
            int materialId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, staffUserId, ct);
            EnsureRepairQuotationSource(task);
            EnsureTaskIsPending(task, "remove material from");

            var material = await _materialRepository.GetMaterialByIdForTaskAsync(materialId, taskId, ct);
            if (material == null)
            {
                throw new NotFoundException(
                    $"Material {materialId} was not found in task {taskId}.");
            }

            _materialRepository.Delete(material);
            await _materialRepository.SaveChangesAsync(ct);

            var updatedMaterials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, updatedMaterials);
        }

        public async Task<TaskDto> SubmitQuotationAsync(
            int taskId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, staffUserId, ct);
            EnsureTaskIsPending(task, "submit a quotation for");
            EnsureRepairQuotationSource(task);

            var materials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            EnsureQuotationHasMaterials(materials);

            var totalCost = materials.Sum(material => material.Amount);
            ApplySubmittedQuotation(task, materials, totalCost);

            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync(ct);

            await NotifyManagersAsync(task, totalCost, staffUserId, ct);

            return _mapper.Map<TaskDto>(task);
        }

        private async Task<StaffTask> LoadTaskOrThrowAsync(
            int taskId,
            int staffUserId,
            CancellationToken ct)
        {
            return await _taskRepository.GetTaskByIdForStaffAsync(taskId, staffUserId, ct)
                ?? throw new NotFoundException($"Task {taskId} was not found.");
        }

        private async Task<RepairPrice> LoadRepairPriceOrThrowAsync(
            int repairPriceId,
            int marketId,
            CancellationToken ct)
        {
            var repairPrice = await _repairPriceRepository.GetActiveByIdForMarketAsync(repairPriceId, marketId, ct);
            if (repairPrice == null)
            {
                throw new NotFoundException(
                    $"Material {repairPriceId} was not found or is inactive.");
            }

            return repairPrice;
        }

        private async Task ValidateMaterialRequestAsync(
            AddMaterialRequest request,
            CancellationToken ct)
        {
            var validationResult = await _addMaterialValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(error => error.ErrorMessage)));
            }
        }

        private static void EnsureTaskIsPending(StaffTask task, string action)
        {
            if (task.Status != "Pending")
            {
                throw new BadRequestException(
                    $"Cannot {action} a task with status '{task.Status}'.");
            }
        }

        private static void EnsureRepairQuotationSource(StaffTask task)
        {
            if (task.TaskType != "Repair")
            {
                throw new BadRequestException(
                    "Only Repair tasks can use a repair quotation.");
            }

            var hasRequest = task.RequestId.HasValue;
            var hasIssue = task.IssueId.HasValue;
            if (hasRequest == hasIssue)
            {
                throw new BadRequestException(
                    "A repair quotation task must link to exactly one Request or Issue.");
            }

            if (hasRequest && task.Request?.RequestType != "FacilityIssue")
            {
                throw new BadRequestException(
                    "A linked Request must be a FacilityIssue request.");
            }
        }

        private static void EnsureQuotationHasMaterials(
            IReadOnlyCollection<TaskMaterial> materials)
        {
            if (materials.Count == 0)
            {
                throw new BadRequestException(
                    "A quotation must contain at least one material before submission.");
            }
        }

        private static decimal ResolveUnitPrice(
            RepairPrice repairPrice,
            AddMaterialRequest request)
        {
            if (repairPrice.Price > 0)
            {
                return repairPrice.Price;
            }

            if (!request.CustomUnitPrice.HasValue || request.CustomUnitPrice.Value <= 0)
            {
                throw new BadRequestException(
                    $"Material '{repairPrice.ItemName}' requires a positive custom unit price.");
            }

            return request.CustomUnitPrice.Value;
        }

        private static TaskMaterial CreateTaskMaterial(
            int taskId,
            RepairPrice repairPrice,
            AddMaterialRequest request,
            decimal unitPrice)
        {
            return new TaskMaterial
            {
                TaskId = taskId,
                RepairPriceId = request.RepairPriceId,
                ItemName = repairPrice.ItemName,
                Quantity = request.Quantity,
                UnitPrice = unitPrice,
                Amount = (decimal)request.Quantity * unitPrice,
                RepairPrice = repairPrice
            };
        }

        private static void ApplySubmittedQuotation(
            StaffTask task,
            IEnumerable<TaskMaterial> materials,
            decimal totalCost)
        {
            task.ActualCost = totalCost;
            task.Status = "PendingApproval";

            if (task.Request != null)
            {
                task.Request.Status = "PendingManagerReview";
                task.Request.PaidBy = null;
                task.Request.IsQuoteApproved = null;
                task.Request.QuotationAmount = totalCost;
                task.Request.QuotationText = BuildQuotationText(materials);
                task.Request.UpdatedAt = DateTime.UtcNow;
            }
        }

        private static string BuildQuotationText(IEnumerable<TaskMaterial> materials)
        {
            var lines = materials.Select(material =>
                $"- {material.ItemName}: {material.Quantity} x " +
                $"{material.UnitPrice:#,##0} VND = {material.Amount:#,##0} VND");

            return string.Join("\n", lines);
        }

        private static QuotationSummaryDto BuildQuotationSummary(
            StaffTask task,
            List<TaskMaterial> materials)
        {
            var lines = materials.Select(MapMaterialToLineDto).ToList();

            return new QuotationSummaryDto
            {
                TaskId = task.TaskId,
                TaskStatus = task.Status ?? "Pending",
                Materials = lines,
                TotalAmount = lines.Sum(line => line.Amount)
            };
        }

        private async Task NotifyManagersAsync(
            StaffTask task,
            decimal totalCost,
            int staffUserId,
            CancellationToken ct)
        {
            var marketId = task.AssignedToUser?.MarketId;
            if (!marketId.HasValue)
            {
                var assignedStaff = await _userRepository.GetUserByIdWithRoleAsync(
                    task.AssignedToUserId, ct);
                marketId = assignedStaff?.MarketId;
            }

            if (!marketId.HasValue)
            {
                return;
            }

            var managers = await _userRepository.GetActiveManagersByMarketAsync(
                marketId.Value, ct);

            foreach (var manager in managers)
            {
                try
                {
                    await _notificationService.CreateAsync(new CreateNotificationRequest
                    {
                        Title = "Repair Quotation Requires Decision",
                        Content = $"Task #{task.TaskId} - {task.Title} has a quotation of " +
                            $"{totalCost:#,##0} VND and requires a payer decision.",
                        NotiType = "Request",
                        CreatedByUserId = staffUserId,
                        TargetUserId = manager.UserId
                    }, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(
                        ex,
                        "Could not send quotation notification for task {TaskId} to user {UserId}.",
                        task.TaskId,
                        manager.UserId);
                }
            }
        }

        private static MaterialLineDto MapMaterialToLineDto(TaskMaterial material)
        {
            return new MaterialLineDto
            {
                Id = material.Id,
                RepairPriceId = material.RepairPriceId,
                ItemName = material.ItemName,
                Unit = material.RepairPrice?.Unit ?? string.Empty,
                Quantity = material.Quantity,
                UnitPrice = material.UnitPrice,
                Amount = material.Amount
            };
        }

        private static RepairPriceDto MapRepairPriceToDto(RepairPrice price)
        {
            return new RepairPriceDto
            {
                RepairPriceId = price.RepairPriceId,
                ItemName = price.ItemName,
                Unit = price.Unit,
                Price = price.Price,
                Description = price.Description
            };
        }
    }
}
