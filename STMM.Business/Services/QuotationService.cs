using AutoMapper;
using FluentValidation;
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
        private readonly INotificationService _notificationService;
        private readonly IValidator<AddMaterialRequest> _addMaterialValidator;
        private readonly IMapper _mapper;

        public QuotationService(
            IStaffTaskRepository taskRepository,
            ITaskMaterialRepository materialRepository,
            IRepairPriceRepository repairPriceRepository,
            INotificationService notificationService,
            IValidator<AddMaterialRequest> addMaterialValidator,
            IMapper mapper)
        {
            _taskRepository = taskRepository;
            _materialRepository = materialRepository;
            _repairPriceRepository = repairPriceRepository;
            _notificationService = notificationService;
            _addMaterialValidator = addMaterialValidator;
            _mapper = mapper;
        }

        public async Task<List<RepairPriceDto>> GetRepairPricesAsync(
            CancellationToken ct = default)
        {
            var prices = await _repairPriceRepository.FindAsync(
                price => price.IsActive == true, ct);

            return prices
                .OrderBy(price => price.ItemName)
                .Select(MapRepairPriceToDto)
                .ToList();
        }

        public async Task<QuotationSummaryDto> GetQuotationAsync(
            int taskId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);

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

            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "thêm vật tư vào");

            var repairPrice = await LoadRepairPriceOrThrowAsync(request.RepairPriceId, ct);
            var unitPrice = ResolveUnitPrice(repairPrice, request);
            var material = CreateTaskMaterial(taskId, repairPrice, request, unitPrice);

            await _materialRepository.AddAsync(material, ct);
            await _materialRepository.SaveChangesAsync(ct);

            var updatedMaterials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, updatedMaterials);
        }

        public async Task<QuotationSummaryDto> RemoveMaterialAsync(
            int taskId,
            int materialId,
            int staffUserId,
            CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "xóa vật tư khỏi");

            var material = await _materialRepository.GetMaterialByIdAsync(materialId, ct);
            if (material == null || material.TaskId != taskId)
            {
                throw new NotFoundException(
                    $"Không tìm thấy vật tư {materialId} trong task {taskId}.");
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
            var task = await _taskRepository.GetTaskByIdWithRelationsAsync(taskId, ct)
                ?? throw new NotFoundException($"Không tìm thấy task {taskId}.");

            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "gửi báo giá cho");
            EnsureRepairQuotationSource(task);

            var materials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            EnsureQuotationHasMaterials(materials);

            var totalCost = materials.Sum(material => material.Amount);
            ApplySubmittedQuotation(task, materials, totalCost);

            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync(ct);

            await NotifyManagerAsync(task, totalCost, staffUserId, ct);

            var updatedTask = await _taskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(updatedTask!);
        }

        private async Task<StaffTask> LoadTaskOrThrowAsync(
            int taskId,
            CancellationToken ct)
        {
            return await _taskRepository.GetByIdAsync(taskId, ct)
                ?? throw new NotFoundException($"Không tìm thấy task {taskId}.");
        }

        private async Task<RepairPrice> LoadRepairPriceOrThrowAsync(
            int repairPriceId,
            CancellationToken ct)
        {
            var repairPrice = await _repairPriceRepository.GetByIdAsync(repairPriceId, ct);
            if (repairPrice == null || repairPrice.IsActive != true)
            {
                throw new NotFoundException(
                    $"Không tìm thấy vật tư {repairPriceId} hoặc vật tư đã ngừng sử dụng.");
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

        private static void EnsureAssignedToStaff(StaffTask task, int staffUserId)
        {
            if (task.AssignedToUserId != staffUserId)
            {
                throw new BadRequestException(
                    "Bạn không được phân công thực hiện task này.");
            }
        }

        private static void EnsureTaskIsPending(StaffTask task, string action)
        {
            if (task.Status != "Pending")
            {
                throw new BadRequestException(
                    $"Không thể {action} task ở trạng thái '{task.Status}'.");
            }
        }

        private static void EnsureRepairQuotationSource(StaffTask task)
        {
            if (task.TaskType != "Repair")
            {
                throw new BadRequestException(
                    "Chỉ task Repair mới được gửi báo giá sửa chữa.");
            }

            var hasRequest = task.RequestId.HasValue;
            var hasIssue = task.IssueId.HasValue;
            if (hasRequest == hasIssue)
            {
                throw new BadRequestException(
                    "Task báo giá phải liên kết đúng một nguồn: Request hoặc Issue.");
            }

            if (hasRequest && task.Request?.RequestType != "FacilityIssue")
            {
                throw new BadRequestException(
                    "Task liên kết Request chỉ được báo giá cho FacilityIssue.");
            }
        }

        private static void EnsureQuotationHasMaterials(
            IReadOnlyCollection<TaskMaterial> materials)
        {
            if (materials.Count == 0)
            {
                throw new BadRequestException(
                    "Báo giá phải có ít nhất một dòng vật tư trước khi gửi duyệt.");
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
                    $"Vật tư '{repairPrice.ItemName}' yêu cầu nhập đơn giá tùy chỉnh.");
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
                Amount = (decimal)request.Quantity * unitPrice
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
                $"{material.UnitPrice:#,##0} VNĐ = {material.Amount:#,##0} VNĐ");

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

        private async Task NotifyManagerAsync(
            StaffTask task,
            decimal totalCost,
            int staffUserId,
            CancellationToken ct)
        {
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = "Báo giá sửa chữa cần quyết định",
                Content = $"Task \"{task.Title}\" có báo giá {totalCost:#,##0} VNĐ " +
                    "cần Manager xác định bên chịu phí.",
                NotiType = "Request",
                CreatedByUserId = staffUserId,
                TargetRole = "Manager"
            }, ct);
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
