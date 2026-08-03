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
using FluentValidation;

namespace STMM.Business.Services
{
    public class FinancialConfigService : IFinancialConfigService
    {
        private readonly IFeeTypeRepository _feeTypeRepository;
        private readonly IServiceRepository _serviceRepository;
        private readonly ISystemConfigRepository _systemConfigRepository;
        private readonly IUserRepository _userRepository;
        private readonly IValidator<CreateFeeTypeRequest> _createFeeTypeValidator;
        private readonly IValidator<UpdateFeeTypeRequest> _updateFeeTypeValidator;
        private readonly IValidator<CreateServiceRequest> _createServiceValidator;
        private readonly IValidator<UpdateServiceRequest> _updateServiceValidator;
        private readonly IValidator<UpdateSystemConfigRequest> _updateSystemConfigValidator;
        private readonly IValidator<UpdateTiersRequest> _updateTiersValidator;

        public FinancialConfigService(
            IFeeTypeRepository feeTypeRepository,
            IServiceRepository serviceRepository,
            ISystemConfigRepository systemConfigRepository,
            IUserRepository userRepository,
            IValidator<CreateFeeTypeRequest> createFeeTypeValidator,
            IValidator<UpdateFeeTypeRequest> updateFeeTypeValidator,
            IValidator<CreateServiceRequest> createServiceValidator,
            IValidator<UpdateServiceRequest> updateServiceValidator,
            IValidator<UpdateSystemConfigRequest> updateSystemConfigValidator,
            IValidator<UpdateTiersRequest> updateTiersValidator)
        {
            _feeTypeRepository = feeTypeRepository;
            _serviceRepository = serviceRepository;
            _systemConfigRepository = systemConfigRepository;
            _userRepository = userRepository;
            _createFeeTypeValidator = createFeeTypeValidator;
            _updateFeeTypeValidator = updateFeeTypeValidator;
            _createServiceValidator = createServiceValidator;
            _updateServiceValidator = updateServiceValidator;
            _updateSystemConfigValidator = updateSystemConfigValidator;
            _updateTiersValidator = updateTiersValidator;
        }

        // --- FEE TYPES ---
        public async Task<IEnumerable<FeeTypeDto>> GetFeeTypesAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var items = await _feeTypeRepository.GetAllAsync(user?.MarketId, ct);
            return items.Select(f => new FeeTypeDto
            {
                FeeTypeId = f.FeeTypeId,
                Name = f.Name,
                Unit = f.Unit,
                Description = f.Description
            });
        }

        public async Task<FeeTypeDto> CreateFeeTypeAsync(int userId, CreateFeeTypeRequest request, CancellationToken ct = default)
        {
            var valResult = await _createFeeTypeValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);

            // Kiểm tra trùng lặp tên loại phí
            var isDuplicate = await _feeTypeRepository.IsNameExistsAsync(request.Name, null, user?.MarketId, ct);
            if (isDuplicate)
            {
                throw new BadRequestException("Tên loại phí này đã tồn tại trong hệ thống.");
            }

            var item = new FeeType
            {
                Name = request.Name.Trim(),
                Unit = request.Unit?.Trim(),
                Description = request.Description?.Trim(),
                MarketId = user?.MarketId
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

        public async Task<FeeTypeDto> UpdateFeeTypeAsync(int userId, int id, UpdateFeeTypeRequest request, CancellationToken ct = default)
        {
            if (id <= 8)
            {
                throw new BadRequestException("Không thể sửa loại phí mặc định của hệ thống.");
            }
            
            var valResult = await _updateFeeTypeValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var item = await _feeTypeRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy Loại phí ID {id}.");
            }
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền cập nhật loại phí của chợ khác.");

            // Kiểm tra trùng lặp tên loại phí (ngoại trừ chính nó)
            var isDuplicate = await _feeTypeRepository.IsNameExistsAsync(request.Name, id, item.MarketId, ct);
            if (isDuplicate)
            {
                throw new BadRequestException("Tên loại phí này đã tồn tại trong hệ thống.");
            }

            item.Name = request.Name.Trim();
            item.Unit = request.Unit?.Trim();
            item.Description = request.Description?.Trim();

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

        public async Task<bool> DeleteFeeTypeAsync(int userId, int id, CancellationToken ct = default)
        {
            if (id <= 8)
            {
                throw new BadRequestException("Không thể xóa loại phí mặc định của hệ thống.");
            }

            var item = await _feeTypeRepository.GetByIdAsync(id, ct);
            if (item == null) return false;
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền xóa loại phí của chợ khác.");

            // Kiểm tra xem có dịch vụ nào đang hoạt động liên kết với loại phí này không
            var hasService = await _serviceRepository.IsFeeTypeInUseAsync(id, item.MarketId, ct);
            if (hasService)
            {
                throw new BadRequestException("Không thể xóa loại phí này vì hiện đang có dịch vụ hoạt động liên kết với nó.");
            }

            try
            {
                _feeTypeRepository.Delete(item);
                await _feeTypeRepository.SaveChangesAsync(ct);
            }
            catch (Exception)
            {
                throw new BadRequestException("Không thể xóa loại phí này vì nó đang được liên kết với dữ liệu hóa đơn hoặc các dữ liệu khác trong hệ thống.");
            }

            return true;
        }

        // --- SERVICES ---
        public async Task<IEnumerable<ServiceDto>> GetServicesAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var items = await _serviceRepository.GetServicesWithFeeTypeAsync(user?.MarketId, ct);

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

        public async Task<ServiceDto> CreateServiceAsync(int userId, CreateServiceRequest request, CancellationToken ct = default)
        {
            var valResult = await _createServiceValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);

            // Kiểm tra trùng lặp tên dịch vụ (chỉ so với dịch vụ đang hoạt động)
            var isDuplicate = await _serviceRepository.IsNameExistsAsync(request.Name, null, user?.MarketId, ct);
            if (isDuplicate)
            {
                throw new BadRequestException("Tên dịch vụ này đã tồn tại và đang hoạt động trong hệ thống.");
            }

            var item = new Service
            {
                Name = request.Name.Trim(),
                Description = request.Description?.Trim(),
                Price = request.Price,
                BillingCycle = request.BillingCycle ?? "Monthly",
                FeeTypeId = request.FeeTypeId,
                CreatedByUserId = request.CreatedByUserId,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
                MarketId = user?.MarketId
            };

            await _serviceRepository.AddAsync(item, ct);
            await _serviceRepository.SaveChangesAsync(ct);

            var fresh = await _serviceRepository.GetServiceWithFeeTypeByIdAsync(item.ServiceId, item.MarketId, ct);

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

        public async Task<ServiceDto> UpdateServiceAsync(int userId, int id, UpdateServiceRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateServiceValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var item = await _serviceRepository.GetByIdAsync(id, ct);
            if (item == null)
            {
                throw new NotFoundException($"Không tìm thấy Dịch vụ ID {id}.");
            }
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền cập nhật dịch vụ của chợ khác.");

            // Kiểm tra trùng lặp tên dịch vụ (chỉ so với dịch vụ đang hoạt động khác chính nó)
            var isDuplicate = await _serviceRepository.IsNameExistsAsync(request.Name, id, item.MarketId, ct);
            if (isDuplicate)
            {
                throw new BadRequestException("Tên dịch vụ này đã tồn tại và đang hoạt động trong hệ thống.");
            }

            item.Name = request.Name.Trim();
            item.Description = request.Description?.Trim();
            item.Price = request.Price;
            item.BillingCycle = request.BillingCycle ?? "Monthly";
            item.FeeTypeId = request.FeeTypeId;
            item.IsActive = request.IsActive;
            item.UpdatedAt = DateTime.UtcNow;

            _serviceRepository.Update(item);
            await _serviceRepository.SaveChangesAsync(ct);

            var fresh = await _serviceRepository.GetServiceWithFeeTypeByIdAsync(item.ServiceId, item.MarketId, ct);

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

        public async Task<bool> DeleteServiceAsync(int userId, int id, CancellationToken ct = default)
        {
            var item = await _serviceRepository.GetByIdAsync(id, ct);
            if (item == null) return false;
            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && item.MarketId != user.MarketId)
                throw new ForbiddenException("Bạn không có quyền xóa dịch vụ của chợ khác.");

            // Mềm: đặt IsActive = false thay vì xóa hẳn để tránh lỗi dữ liệu lịch sử
            item.IsActive = false;
            item.UpdatedAt = DateTime.UtcNow;
            _serviceRepository.Update(item);

            await _serviceRepository.SaveChangesAsync(ct);
            return true;
        }

        // --- SYSTEM CONFIGS ---
        public async Task<IEnumerable<SystemConfigDto>> GetSystemConfigsAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var items = await _systemConfigRepository.GetAllAsync(user?.MarketId, ct);

            // Lọc ra các cấu hình ưu tiên (nếu có riêng của Market thì bỏ qua cái Global)
            var itemsList = items.GroupBy(x => x.ConfigKey)
                                 .Select(g => g.OrderByDescending(x => x.MarketId).First())
                                 .ToList();

            // Tự động seed các cấu hình bắt buộc nếu chưa có (Global Configs)
            var requiredConfigs = new Dictionary<string, (string DefaultValue, string Description)>
            {
                { "auto_invoice_day", ("5", "Ngày trong tháng tự động khởi tạo hóa đơn của các sạp (1-28)") },
                { "invoice_due_days", ("15", "Số ngày hạn thanh toán hóa đơn kể từ lúc phát hành") },
                { "late_penalty_rate_per_day", ("0.05", "Phần trăm lãi suất phạt quá hạn theo ngày (%)") },
                { "reminder_days_before_due", ("3", "Số ngày gửi thông báo nhắc nhở trước khi đến hạn thanh toán") },
                { "vat_tax_rate", ("0", "Thuế giá trị gia tăng áp dụng cho hóa đơn (%)") }
            };

            bool hasChanges = false;
            foreach (var req in requiredConfigs)
            {
                if (!itemsList.Any(c => c.ConfigKey == req.Key))
                {
                    var config = new SystemConfig
                    {
                        ConfigKey = req.Key,
                        ConfigValue = req.Value.DefaultValue,
                        Description = req.Value.Description,
                        UpdatedByUserId = 1, // Default user
                        UpdatedAt = DateTime.UtcNow,
                        MarketId = null // Cấu hình mặc định toàn hệ thống
                    };
                    await _systemConfigRepository.AddAsync(config, ct);
                    hasChanges = true;
                }
            }

            if (hasChanges)
            {
                await _systemConfigRepository.SaveChangesAsync(ct);
                // Nạp lại danh sách sau khi seed
                var reloaded = await _systemConfigRepository.GetAllAsync(user?.MarketId, ct);
                itemsList = reloaded.GroupBy(x => x.ConfigKey)
                                    .Select(g => g.OrderByDescending(x => x.MarketId).First())
                                    .ToList();
            }

            // Lọc bỏ cấu hình bậc thang khỏi danh sách cấu hình chung để tránh hiển thị JSON thô
            return itemsList
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

        public async Task<bool> UpdateSystemConfigAsync(int userId, UpdateSystemConfigRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateSystemConfigValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);
            var config = await _systemConfigRepository.GetSystemConfigByKeyAsync(request.ConfigKey, user?.MarketId, ct);

            // Kiểm tra xem config hiện tại là của riêng chợ này hay là của chung (MarketId = null)
            // Nếu người dùng thuộc về 1 chợ cụ thể, nhưng config lấy ra lại là của chung (MarketId == null),
            // => KHÔNG được ghi đè config chung, mà phải tạo ra một dòng mới (override) riêng cho chợ này.
            bool isGlobalConfigWhileUserHasMarket = config != null && config.MarketId == null && user?.MarketId != null;

            if (config == null || isGlobalConfigWhileUserHasMarket)
            {
                var newConfig = new SystemConfig
                {
                    ConfigKey = request.ConfigKey,
                    ConfigValue = request.ConfigValue,
                    UpdatedByUserId = request.UpdatedByUserId,
                    UpdatedAt = DateTime.UtcNow,
                    MarketId = user?.MarketId,
                    Description = config?.Description
                };
                await _systemConfigRepository.AddAsync(newConfig, ct);
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
        public async Task<List<UtilityTierStep>> GetTiersAsync(int userId, string configKey, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var config = await _systemConfigRepository.GetSystemConfigByKeyAsync(configKey, user?.MarketId, ct);

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

        public async Task<bool> UpdateTiersAsync(int userId, UpdateTiersRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateTiersValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
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

            var user = await _userRepository.GetByIdAsync(userId, ct);
            var config = await _systemConfigRepository.GetSystemConfigByKeyAsync(request.ConfigKey, user?.MarketId, ct);

            if (config == null)
            {
                config = new SystemConfig
                {
                    ConfigKey = request.ConfigKey,
                    ConfigValue = json,
                    Description = request.ConfigKey == "electricity_tiers" ? "Biểu giá điện bậc thang" : "Biểu giá nước bậc thang",
                    UpdatedByUserId = request.UpdatedByUserId,
                    UpdatedAt = DateTime.UtcNow,
                    MarketId = user?.MarketId
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
