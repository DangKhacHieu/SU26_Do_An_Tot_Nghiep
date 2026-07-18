using Microsoft.EntityFrameworkCore;
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

        public RepairPriceService(
            IRepairPriceRepository repairPriceRepository,
            ITaskMaterialRepository taskMaterialRepository)
        {
            _repairPriceRepository = repairPriceRepository;
            _taskMaterialRepository = taskMaterialRepository;
        }

        public async Task<IEnumerable<RepairPriceDto>> GetRepairPricesAsync(CancellationToken ct = default)
        {
            var items = await _repairPriceRepository.GetAllAsync(ct);
            
            // Get usage counts grouped by RepairPriceId
            var usageCounts = await _taskMaterialRepository.Query()
                .GroupBy(m => m.RepairPriceId)
                .Select(g => new { RepairPriceId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.RepairPriceId, x => x.Count, ct);

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

        public async Task<RepairPriceDto> GetRepairPriceByIdAsync(int id, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id}.");
            }

            var usageCount = await _taskMaterialRepository.Query()
                .Where(m => m.RepairPriceId == id)
                .CountAsync(ct);

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

        public async Task<RepairPriceDto> CreateRepairPriceAsync(CreateRepairPriceRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                throw new BadRequestException("Tên hạng mục sửa chữa không được để trống.");
            }
            if (string.IsNullOrWhiteSpace(request.Unit))
            {
                throw new BadRequestException("Đơn vị tính không được để trống.");
            }
            if (request.Price < 0)
            {
                throw new BadRequestException("Đơn giá sửa chữa không được âm.");
            }

            // Check duplicate name
            var duplicate = await _repairPriceRepository.Query()
                .AnyAsync(r => r.ItemName.ToLower() == request.ItemName.ToLower(), ct);
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
                UpdatedAt = DateTime.UtcNow
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

        public async Task<RepairPriceDto> UpdateRepairPriceAsync(int id, UpdateRepairPriceRequest request, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id}.");
            }

            if (string.IsNullOrWhiteSpace(request.ItemName))
            {
                throw new BadRequestException("Tên hạng mục sửa chữa không được để trống.");
            }
            if (string.IsNullOrWhiteSpace(request.Unit))
            {
                throw new BadRequestException("Đơn vị tính không được để trống.");
            }
            if (request.Price < 0)
            {
                throw new BadRequestException("Đơn giá sửa chữa không được âm.");
            }

            // Check duplicate name with other items
            var duplicate = await _repairPriceRepository.Query()
                .AnyAsync(r => r.ItemName.ToLower() == request.ItemName.ToLower() && r.RepairPriceId != id, ct);
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

            var usageCount = await _taskMaterialRepository.Query()
                .Where(m => m.RepairPriceId == id)
                .CountAsync(ct);

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

        public async Task<bool> DeleteRepairPriceAsync(int id, CancellationToken ct = default)
        {
            var item = await _repairPriceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy hạng mục sửa chữa ID {id} để xóa.");
            }

            // Check if already used in TaskMaterials
            var inUse = await _taskMaterialRepository.Query()
                .AnyAsync(m => m.RepairPriceId == id, ct);

            if (inUse)
            {
                // Soft delete: set IsActive to false
                item.IsActive = false;
                item.UpdatedAt = DateTime.UtcNow;
                _repairPriceRepository.Update(item);
                await _repairPriceRepository.SaveChangesAsync(ct);
                return true; // Marked inactive successfully
            }
            else
            {
                // Hard delete
                _repairPriceRepository.Delete(item);
                await _repairPriceRepository.SaveChangesAsync(ct);
                return true; // Deleted successfully
            }
        }

        public async Task<IEnumerable<UsedRepairToolDto>> GetUsedRepairToolsAsync(CancellationToken ct = default)
        {
            var items = await _taskMaterialRepository.Query()
                .Include(m => m.RepairPrice)
                .Include(m => m.StaffTask)
                    .ThenInclude(t => t.AssignedToUser)
                .OrderByDescending(m => m.Id)
                .ToListAsync(ct);

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
