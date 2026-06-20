using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Dashboard;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class FinancialConfigService : IFinancialConfigService
    {
        private readonly IFeeTypeRepository _feeTypeRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly ISystemConfigRepository _systemConfigRepository;

        public FinancialConfigService(
            IFeeTypeRepository feeTypeRepository,
            IServiceRepository serviceRepository,
            ISystemConfigRepository systemConfigRepository)
        {
            _feeTypeRepository = feeTypeRepository;
            _serviceRepository = serviceRepository;
            _systemConfigRepository = systemConfigRepository;
        }

        // --- FEE TYPES ---
        public async Task<IEnumerable<FeeTypeDto>> GetFeeTypesAsync(CancellationToken ct = default)
        {
            var items = await _feeTypeRepository.GetAllAsync(ct);
            return items.Select(f => new FeeTypeDto
            {
                FeeTypeId = f.FeeTypeId,
                Name = f.Name,
                Unit = f.Unit,
                Description = f.Description
            });
        }

        public async Task<FeeTypeDto> CreateFeeTypeAsync(CreateFeeTypeRequest request, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(request.Name))
            {
                throw new BadRequestException("Tên loại phí không được để trống.");
            }

            var item = new FeeType
            {
                Name = request.Name,
                Unit = request.Unit,
                Description = request.Description
            };

            await _feeTypeRepository.AddAsync(item, ct);
            await _feeTypeRepository.SaveChangesAsync(ct);

            return new FeeTypeDto
            {
                FeeTypeId = item.FeeTypeId,
                Name = item.Name,
                Unit = item.Unit,
                Description = item.Description
            };
        }

        public async Task<FeeTypeDto> UpdateFeeTypeAsync(int id, UpdateFeeTypeRequest request, CancellationToken ct = default)
        {
            var item = await _feeTypeRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy Loại phí ID {id}.");
            }

            item.Name = request.Name;
            item.Unit = request.Unit;
            item.Description = request.Description;

            _feeTypeRepository.Update(item);
            await _feeTypeRepository.SaveChangesAsync(ct);

            return new FeeTypeDto
            {
                FeeTypeId = item.FeeTypeId,
                Name = item.Name,
                Unit = item.Unit,
                Description = item.Description
            };
        }

        public async Task<bool> DeleteFeeTypeAsync(int id, CancellationToken ct = default)
        {
            var item = await _feeTypeRepository.GetByIdAsync(id, ct);
            if (item == null) return false;

            _feeTypeRepository.Delete(item);
            await _feeTypeRepository.SaveChangesAsync(ct);
            return true;
        }

        // --- SERVICES ---
        public async Task<IEnumerable<ServiceDto>> GetServicesAsync(CancellationToken ct = default)
        {
            var items = await _serviceRepository.Query()
                .Include(s => s.FeeType)
                .Where(s => s.IsActive != false)
                .ToListAsync(ct);

            return items.Select(s => new ServiceDto
            {
                ServiceId = s.ServiceId,
                Name = s.Name,
                Description = s.Description,
                Price = s.Price,
                BillingCycle = s.BillingCycle,
                FeeTypeId = s.FeeTypeId,
                FeeTypeName = s.FeeType?.Name ?? "Chưa liên kết",
                CreatedByUserId = s.CreatedByUserId,
                IsActive = s.IsActive ?? true
            });
        }

        public async Task<ServiceDto> CreateServiceAsync(CreateServiceRequest request, CancellationToken ct = default)
        {
            var item = new Service
            {
                Name = request.Name,
                Description = request.Description,
                Price = request.Price,
                BillingCycle = request.BillingCycle ?? "Monthly",
                FeeTypeId = request.FeeTypeId,
                CreatedByUserId = request.CreatedByUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _serviceRepository.AddAsync(item, ct);
            await _serviceRepository.SaveChangesAsync(ct);

            var fresh = await _serviceRepository.Query()
                .Include(s => s.FeeType)
                .FirstOrDefaultAsync(s => s.ServiceId == item.ServiceId, ct);

            return new ServiceDto
            {
                ServiceId = fresh!.ServiceId,
                Name = fresh.Name,
                Description = fresh.Description,
                Price = fresh.Price,
                BillingCycle = fresh.BillingCycle,
                FeeTypeId = fresh.FeeTypeId,
                FeeTypeName = fresh.FeeType?.Name ?? string.Empty,
                CreatedByUserId = fresh.CreatedByUserId,
                IsActive = fresh.IsActive ?? true
            };
        }

        public async Task<ServiceDto> UpdateServiceAsync(int id, UpdateServiceRequest request, CancellationToken ct = default)
        {
            var item = await _serviceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy Dịch vụ ID {id}.");
            }

            item.Name = request.Name;
            item.Description = request.Description;
            item.Price = request.Price;
            item.BillingCycle = request.BillingCycle ?? "Monthly";
            item.FeeTypeId = request.FeeTypeId;
            item.IsActive = request.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            _serviceRepository.Update(item);
            await _serviceRepository.SaveChangesAsync(ct);

            var fresh = await _serviceRepository.Query()
                .Include(s => s.FeeType)
                .FirstOrDefaultAsync(s => s.ServiceId == item.ServiceId, ct);

            return new ServiceDto
            {
                ServiceId = fresh!.ServiceId,
                Name = fresh.Name,
                Description = fresh.Description,
                Price = fresh.Price,
                BillingCycle = fresh.BillingCycle,
                FeeTypeId = fresh.FeeTypeId,
                FeeTypeName = fresh.FeeType?.Name ?? string.Empty,
                CreatedByUserId = fresh.CreatedByUserId,
                IsActive = fresh.IsActive ?? true
            };
        }

        public async Task<bool> DeleteServiceAsync(int id, CancellationToken ct = default)
        {
            var item = await _serviceRepository.GetByIdAsync(id, ct);
            if (item == null) return false;

            // Mềm: đặt IsActive = false thay vì xóa hẳn để tránh lỗi dữ liệu lịch sử
            item.IsActive = false;
            item.UpdatedAt = DateTime.UtcNow;
            _serviceRepository.Update(item);

            await _serviceRepository.SaveChangesAsync(ct);
            return true;
        }

        // --- SYSTEM CONFIGS ---
        public async Task<IEnumerable<SystemConfigDto>> GetSystemConfigsAsync(CancellationToken ct = default)
        {
            var items = await _systemConfigRepository.GetAllAsync(ct);
            // Lọc bỏ cấu hình bậc thang khỏi danh sách cấu hình chung để tránh hiển thị JSON thô
            return items
                .Where(c => c.ConfigKey != "electricity_tiers" && c.ConfigKey != "water_tiers")
                .Select(c => new SystemConfigDto
                {
                    ConfigId = c.ConfigId,
                    ConfigKey = c.ConfigKey,
                    ConfigValue = c.ConfigValue,
                    Description = c.Description,
                    UpdatedAt = c.UpdatedAt
                });
        }

        public async Task<bool> UpdateSystemConfigAsync(UpdateSystemConfigRequest request, CancellationToken ct = default)
        {
            var config = await _systemConfigRepository.Query()
                .Where(c => c.ConfigKey == request.ConfigKey)
                .FirstOrDefaultAsync(ct);

            if (config == null)
            {
                config = new SystemConfig
                {
                    ConfigKey = request.ConfigKey,
                    ConfigValue = request.ConfigValue,
                    UpdatedByUserId = request.UpdatedByUserId,
                    UpdatedAt = DateTime.UtcNow
                };
                await _systemConfigRepository.AddAsync(config, ct);
            }
            else
            {
                config.ConfigValue = request.ConfigValue;
                config.UpdatedByUserId = request.UpdatedByUserId;
                config.UpdatedAt = DateTime.UtcNow;
                _systemConfigRepository.Update(config);
            }

            await _systemConfigRepository.SaveChangesAsync(ct);
            return true;
        }

        // --- UTILITY TIERS ---
        public async Task<List<UtilityTierStep>> GetTiersAsync(string configKey, CancellationToken ct = default)
        {
            var config = await _systemConfigRepository.Query()
                .Where(c => c.ConfigKey == configKey)
                .FirstOrDefaultAsync(ct);

            if (config == null || string.IsNullOrEmpty(config.ConfigValue))
            {
                // Trả về danh sách bậc thang mặc định ban đầu nếu DB chưa cấu hình
                return GetDefaultTiers(configKey);
            }

            try
            {
                return JsonSerializer.Deserialize<List<UtilityTierStep>>(config.ConfigValue) ?? GetDefaultTiers(configKey);
            }
            catch
            {
                return GetDefaultTiers(configKey);
            }
        }

        public async Task<bool> UpdateTiersAsync(UpdateTiersRequest request, CancellationToken ct = default)
        {
            if (request == null || request.Steps == null || !request.Steps.Any())
            {
                throw new BadRequestException("Danh sách bậc thang không được trống.");
            }

            // Kiểm tra tính tăng dần liên tục và hợp lệ của các bậc thang
            var sortedSteps = request.Steps.OrderBy(s => s.Step).ToList();
            for (int i = 0; i < sortedSteps.Count; i++)
            {
                var step = sortedSteps[i];
                step.Step = i + 1; // Đồng bộ lại số thứ tự từ 1

                if (i == 0)
                {
                    step.From = 0; // Bậc đầu tiên luôn bắt đầu từ 0
                }
                else
                {
                    var prevStep = sortedSteps[i - 1];
                    if (prevStep.To == null)
                    {
                        throw new BadRequestException("Bậc trước đó đã là vô cùng (null), không thể thêm bậc tiếp theo.");
                    }
                    step.From = prevStep.To.Value + 1; // Chỉ số sau nối tiếp chỉ số trước + 1
                }

                if (step.To.HasValue && step.To.Value <= step.From)
                {
                    throw new BadRequestException($"Bậc {step.Step}: Chỉ số kết thúc ({step.To}) phải lớn hơn chỉ số bắt đầu ({step.From}).");
                }
            }

            var json = JsonSerializer.Serialize(sortedSteps);

            var config = await _systemConfigRepository.Query()
                .Where(c => c.ConfigKey == request.ConfigKey)
                .FirstOrDefaultAsync(ct);

            if (config == null)
            {
                config = new SystemConfig
                {
                    ConfigKey = request.ConfigKey,
                    ConfigValue = json,
                    Description = request.ConfigKey == "electricity_tiers" ? "Biểu giá điện bậc thang" : "Biểu giá nước bậc thang",
                    UpdatedByUserId = request.UpdatedByUserId,
                    UpdatedAt = DateTime.UtcNow
                };
                await _systemConfigRepository.AddAsync(config, ct);
            }
            else
            {
                config.ConfigValue = json;
                config.UpdatedByUserId = request.UpdatedByUserId;
                config.UpdatedAt = DateTime.UtcNow;
                _systemConfigRepository.Update(config);
            }

            await _systemConfigRepository.SaveChangesAsync(ct);
            return true;
        }

        private static List<UtilityTierStep> GetDefaultTiers(string configKey)
        {
            if (configKey == "electricity_tiers")
            {
                return new List<UtilityTierStep>
                {
                    new() { Step = 1, From = 0, To = 50, Price = 1800 },
                    new() { Step = 2, From = 51, To = 100, Price = 2500 },
                    new() { Step = 3, From = 101, To = null, Price = 3500 }
                };
            }
            else // water_tiers
            {
                return new List<UtilityTierStep>
                {
                    new() { Step = 1, From = 0, To = 10, Price = 10000 },
                    new() { Step = 2, From = 11, To = 20, Price = 15000 },
                    new() { Step = 3, From = 21, To = null, Price = 22000 }
                };
            }
        }
    }
}
