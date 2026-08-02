using FluentValidation;
using STMM.Business.DTOs.RepairPrice;
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
    public class RepairPriceService : IRepairPriceService
    {
        private readonly IRepairPriceRepository _repairPriceRepository;
        private readonly ITaskMaterialRepository _taskMaterialRepository;
        private readonly IUserRepository _userRepository;
        public RepairPriceService(
            IRepairPriceRepository repairPriceRepository,
            ITaskMaterialRepository taskMaterialRepository,
            IUserRepository userRepository)
        {
            _repairPriceRepository = repairPriceRepository;
            _taskMaterialRepository = taskMaterialRepository;
            _userRepository = userRepository;
        }

        public async Task<IEnumerable<RepairPriceDto>> GetRepairPricesAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var items = await _repairPriceRepository.GetAllAsync(user?.MarketId, ct);
            
            // Get usage counts grouped by RepairPriceId
            var usageCounts = await _taskMaterialRepository.GetUsageCountsAsync(ct);

            return items.Select(r => new RepairPriceDto
            {
                RepairPriceId = r.RepairPriceId,
                ItemName = r.ItemName,
                Unit = r.Unit,
                Price = r.Price,
                Description = r.Description,
                IsActive = r.IsActive ?? true,
                UsageCount = usageCounts.TryGetValue(r.RepairPriceId, out var count) ? count : 0,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt
            });
        }

        public async Task<RepairPriceDto> GetRepairPriceByIdAsync(int userId, int id, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id}.");
            }
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền xem đơn giá của chợ khác.");

            var usageCount = await _taskMaterialRepository.GetUsageCountByRepairPriceIdAsync(id, ct);

            return new RepairPriceDto
            {
                RepairPriceId = item.RepairPriceId,
                ItemName = item.ItemName,
                Unit = item.Unit,
                Price = item.Price,
                Description = item.Description,
                IsActive = item.IsActive ?? true,
                UsageCount = usageCount,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };
        }

        public async Task<RepairPriceDto> CreateRepairPriceAsync(int userId, CreateRepairPriceRequest request, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);

            // Check duplicate name
            var duplicate = await _repairPriceRepository.IsItemNameExistsAsync(request.ItemName, null, user?.MarketId, ct);
            if (duplicate)
            {
                throw new BadRequestException($"Tên hạng mục '{request.ItemName}' đã tồn tại trong danh mục.");
            }

            var item = new RepairPrice
            {
                ItemName = request.ItemName.Trim(),
                Unit = request.Unit.Trim(),
                Price = request.Price,
                Description = request.Description?.Trim(),
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MarketId = user?.MarketId
            };

            await _repairPriceRepository.AddAsync(item, ct);
            await _repairPriceRepository.SaveChangesAsync(ct);

            return new RepairPriceDto
            {
                RepairPriceId = item.RepairPriceId,
                ItemName = item.ItemName,
                Unit = item.Unit,
                Price = item.Price,
                Description = item.Description,
                IsActive = item.IsActive ?? true,
                UsageCount = 0,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };
        }

        public async Task<RepairPriceDto> UpdateRepairPriceAsync(int userId, int id, UpdateRepairPriceRequest request, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id}.");
            }
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền cập nhật đơn giá của chợ khác.");

            // Check duplicate name with other items
            var duplicate = await _repairPriceRepository.IsItemNameExistsAsync(request.ItemName, id, item.MarketId, ct);
            if (duplicate)
            {
                throw new BadRequestException($"Tên hạng mục '{request.ItemName}' đã tồn tại ở hạng mục khác.");
            }

            item.ItemName = request.ItemName.Trim();
            item.Unit = request.Unit.Trim();
            item.Price = request.Price;
            item.Description = request.Description?.Trim();
            item.IsActive = request.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            _repairPriceRepository.Update(item);
            await _repairPriceRepository.SaveChangesAsync(ct);

            var usageCount = await _taskMaterialRepository.GetUsageCountByRepairPriceIdAsync(id, ct);

            return new RepairPriceDto
            {
                RepairPriceId = item.RepairPriceId,
                ItemName = item.ItemName,
                Unit = item.Unit,
                Price = item.Price,
                Description = item.Description,
                IsActive = item.IsActive ?? true,
                UsageCount = usageCount,
                CreatedAt = item.CreatedAt,
                UpdatedAt = item.UpdatedAt
            };
        }

        public async Task<bool> DeleteRepairPriceAsync(int userId, int id, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id} để xóa.");
            }
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền xóa đơn giá của chợ khác.");

            // Check if already used in TaskMaterials
            var inUse = await _taskMaterialRepository.IsRepairPriceInUseAsync(id, ct);

            if (inUse)
            {
                throw new BadRequestException($"Không thể xóa hạng mục '{item.ItemName}' vì đã được sử dụng trong các lịch sử sửa chữa.");
            }

            // Hard delete
            _repairPriceRepository.Delete(item);
            await _repairPriceRepository.SaveChangesAsync(ct);
            return true; // Deleted successfully
        }

        public async Task<IEnumerable<UsedRepairToolDto>> GetUsedRepairToolsAsync(int userId, CancellationToken ct = default)
        {
            int? marketId = null;
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user != null)
            {
                marketId = user.MarketId;
            }

            var items = await _taskMaterialRepository.GetUsedRepairToolsWithDetailsAsync(marketId, ct);

            return items.Select(m => new UsedRepairToolDto
            {
                Id = m.Id,
                TaskId = m.TaskId,
                TaskTitle = m.StaffTask?.Title ?? "Tác vụ sửa chữa hệ thống",
                AssignedToStaff = m.StaffTask?.AssignedToUser?.Name ?? "Nhân viên kỹ thuật",
                RepairPriceId = m.RepairPriceId,
                ItemName = m.ItemName,
                Quantity = m.Quantity,
                Unit = m.RepairPrice?.Unit ?? "Cái",
                UnitPrice = m.UnitPrice,
                Amount = m.Amount,
                UsedDate = m.StaffTask?.CompletedAt ?? m.StaffTask?.CreatedAt ?? DateTime.UtcNow
            });
        }
    }
}
