using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Quotation;
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

        /// <inheritdoc />
        public async Task<List<RepairPriceDto>> GetRepairPricesAsync(CancellationToken ct = default)
        {
            var prices = await _repairPriceRepository.FindAsync(
                p => p.IsActive == true, ct);

            return prices
                .OrderBy(p => p.ItemName)
                .Select(MapRepairPriceToDto)
                .ToList();
        }

        /// <inheritdoc />
        public async Task<QuotationSummaryDto> GetQuotationAsync(
            int taskId, int staffUserId, CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);

            var materials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, materials);
        }

        /// <inheritdoc />
        public async Task<QuotationSummaryDto> AddMaterialAsync(
            int taskId, int staffUserId, AddMaterialRequest request, CancellationToken ct = default)
        {
            await ValidateRequestOrThrowAsync(request, ct);

            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "add materials to");

            var repairPrice = await LoadRepairPriceOrThrowAsync(request.RepairPriceId, ct);
            var unitPrice = ResolveUnitPrice(repairPrice, request);

            var material = new TaskMaterial
            {
                TaskId = taskId,
                RepairPriceId = request.RepairPriceId,
                ItemName = repairPrice.ItemName,          // snapshot — không bị ảnh hưởng khi catalog thay đổi
                Quantity = request.Quantity,
                UnitPrice = unitPrice,
                Amount = (decimal)request.Quantity * unitPrice
            };

            await _materialRepository.AddAsync(material, ct);
            await _materialRepository.SaveChangesAsync(ct);

            var updatedMaterials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, updatedMaterials);
        }

        /// <inheritdoc />
        public async Task<QuotationSummaryDto> RemoveMaterialAsync(
            int taskId, int materialId, int staffUserId, CancellationToken ct = default)
        {
            var task = await LoadTaskOrThrowAsync(taskId, ct);
            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "remove materials from");

            var material = await _materialRepository.GetMaterialByIdAsync(materialId, ct);
            if (material == null || material.TaskId != taskId)
            {
                throw new NotFoundException($"Material with ID {materialId} not found on task {taskId}.");
            }

            _materialRepository.Delete(material);
            await _materialRepository.SaveChangesAsync(ct);

            var updatedMaterials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            return BuildQuotationSummary(task, updatedMaterials);
        }

        private static readonly HashSet<string> ValidPaidByValues = new(StringComparer.OrdinalIgnoreCase) { "Market", "Vendor" };

        /// <inheritdoc />
        public async Task<TaskDto> SubmitQuotationAsync(
            int taskId, int staffUserId, string paidBy, CancellationToken ct = default)
        {
            var task = await _taskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }

            EnsureAssignedToStaff(task, staffUserId);
            EnsureTaskIsPending(task, "submit quotation for");

            if (string.IsNullOrWhiteSpace(paidBy) || !ValidPaidByValues.Contains(paidBy))
            {
                throw new BadRequestException(
                    "Vui lòng chọn bên chịu phí: 'Market' (BQL) hoặc 'Vendor' (Tiểu thương).");
            }

            var materials = await _materialRepository.GetByTaskIdAsync(taskId, ct);
            if (!materials.Any())
            {
                throw new BadRequestException(
                    "Báo giá phải có ít nhất một dòng vật tư trước khi gửi duyệt.");
            }

            var totalCost = materials.Sum(m => m.Amount);
            task.ActualCost = totalCost;
            task.Status = "PendingApproval";

            if (task.Request != null)
            {
                task.Request.Status = "Quoted";
                task.Request.PaidBy = paidBy;
                task.Request.QuotationAmount = totalCost;
                
                var materialLines = materials.Select(m => $"- {m.ItemName}: {m.Quantity} x {m.UnitPrice:#,##0} VNĐ = {m.Amount:#,##0} VNĐ");
                task.Request.QuotationText = string.Join("\n", materialLines);
                task.Request.UpdatedAt = DateTime.UtcNow;
            }

            _taskRepository.Update(task);
            await _taskRepository.SaveChangesAsync(ct);

            await NotifyQuotationSubmittedAsync(task, totalCost, staffUserId, paidBy, ct);

            var updatedTask = await _taskRepository.GetTaskByIdWithRelationsAsync(taskId, ct);
            return _mapper.Map<TaskDto>(updatedTask!);
        }

        // ── Private helpers ──────────────────────────────────────────────────

        private async Task<StaffTask> LoadTaskOrThrowAsync(int taskId, CancellationToken ct)
        {
            var task = await _taskRepository.GetByIdAsync(taskId, ct);
            if (task == null)
            {
                throw new NotFoundException($"Task with ID {taskId} not found.");
            }
            return task;
        }

        private async Task<RepairPrice> LoadRepairPriceOrThrowAsync(int repairPriceId, CancellationToken ct)
        {
            var repairPrice = await _repairPriceRepository.GetByIdAsync(repairPriceId, ct);
            if (repairPrice == null || repairPrice.IsActive != true)
            {
                throw new NotFoundException($"Repair price with ID {repairPriceId} not found or is inactive.");
            }
            return repairPrice;
        }

        private async Task ValidateRequestOrThrowAsync(AddMaterialRequest request, CancellationToken ct)
        {
            var result = await _addMaterialValidator.ValidateAsync(request, ct);
            if (!result.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", result.Errors.Select(e => e.ErrorMessage)));
            }
        }

        private static void EnsureAssignedToStaff(StaffTask task, int staffUserId)
        {
            if (task.AssignedToUserId != staffUserId)
            {
                throw new BadRequestException("Bạn không được phân công thực hiện task này.");
            }
        }

        private static void EnsureTaskIsPending(StaffTask task, string action)
        {
            if (task.Status != "Pending")
            {
                throw new BadRequestException(
                    $"Không thể {action} task đang ở trạng thái '{task.Status}'. Chỉ task Pending mới được chỉnh sửa báo giá.");
            }
        }

        /// <summary>
        /// Resolves unit price: use catalog price unless the item is "Vật tư khác" (price == 0).
        /// Staff must provide CustomUnitPrice for open-catalog items.
        /// </summary>
        private static decimal ResolveUnitPrice(RepairPrice repairPrice, AddMaterialRequest request)
        {
            var isCatalogPriced = repairPrice.Price > 0;

            if (isCatalogPriced)
            {
                return repairPrice.Price;
            }

            // "Vật tư khác" — Staff must supply a custom price
            if (!request.CustomUnitPrice.HasValue || request.CustomUnitPrice.Value <= 0)
            {
                throw new BadRequestException(
                    $"Vật tư '{repairPrice.ItemName}' yêu cầu nhập đơn giá (CustomUnitPrice) vì không có giá cố định trong danh mục.");
            }

            return request.CustomUnitPrice.Value;
        }

        private static QuotationSummaryDto BuildQuotationSummary(StaffTask task, List<TaskMaterial> materials)
        {
            var lines = materials.Select(MapMaterialToLineDto).ToList();
            return new QuotationSummaryDto
            {
                TaskId = task.TaskId,
                TaskStatus = task.Status ?? "Pending",
                Materials = lines,
                TotalAmount = lines.Sum(l => l.Amount)
            };
        }

        private async Task NotifyQuotationSubmittedAsync(
            StaffTask task, decimal totalCost, int staffUserId, string paidBy, CancellationToken ct)
        {
            if (paidBy == "Market")
            {
                // BQL chịu phí → thông báo Manager duyệt ngân sách
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = "Báo giá cần duyệt (BQL chịu phí)",
                    Content = $"Task \"{task.Title}\" có báo giá {totalCost:#,##0} VNĐ — BQL chịu phí, cần Manager duyệt.",
                    NotiType = "System",
                    CreatedByUserId = staffUserId,
                    TargetRole = "Manager"
                }, ct);
            }
            else
            {
                // Tiểu thương chịu phí → thông báo Manager biết + Vendor duyệt
                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = "Báo giá đã gửi cho Tiểu thương",
                    Content = $"Task \"{task.Title}\" có báo giá {totalCost:#,##0} VNĐ — đã gửi cho Tiểu thương duyệt.",
                    NotiType = "System",
                    CreatedByUserId = staffUserId,
                    TargetRole = "Manager"
                }, ct);
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
