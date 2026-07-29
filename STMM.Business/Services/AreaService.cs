using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Area;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IBusinessCategoryRepository _categoryRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public AreaService(
            IAreaRepository areaRepository, 
            IBusinessCategoryRepository categoryRepository,
            IStallRepository stallRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _areaRepository = areaRepository;
            _categoryRepository = categoryRepository;
            _stallRepository = stallRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<AreaDto>> GetAllAreasAsync(int? marketId = null, int? currentUserId = null)
        {
            if (marketId.HasValue && marketId.Value <= 0)
                throw new BadRequestException("ID Chợ không hợp lệ.");

            if (currentUserId.HasValue)
            {
                var user = await _userRepository.GetUserByIdWithRoleAsync(currentUserId.Value);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue)
                    {
                        return new List<AreaDto>();
                    }
                    marketId = user.MarketId.Value;
                }
            }

            var areas = await _areaRepository.GetAllAreasAsync(marketId);
            return _mapper.Map<IEnumerable<AreaDto>>(areas);
        }

        public async Task<AreaDto?> GetAreaByIdAsync(int id)
        {
            var area = await _areaRepository.GetAreaByIdAsync(id);
            return area == null ? null : _mapper.Map<AreaDto>(area);
        }

        private async Task<int?> ResolveCategoryAsync(int? categoryId, string? categoryName)
        {
            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                var nameLower = categoryName.ToLower().Trim();
                var existingCategory = await _categoryRepository.Query()
                    .FirstOrDefaultAsync(c => c.Name.ToLower() == nameLower);

                if (existingCategory != null)
                {
                    return existingCategory.CategoryId;
                }
                else
                {
                    var newCategory = new BusinessCategory
                    {
                        Name = categoryName.Trim(),
                        Code = "CAT_" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper(),
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    await _categoryRepository.AddAsync(newCategory);
                    await _categoryRepository.SaveChangesAsync();
                    return newCategory.CategoryId;
                }
            }
            return categoryId;
        }

        public async Task<AreaDto> CreateAreaAsync(CreateAreaRequest request)
        {
            if (request.MarketId <= 0)
                throw new BadRequestException("ID Chợ không hợp lệ.");

            if (string.IsNullOrWhiteSpace(request.Name))
                throw new BadRequestException("Tên khu vực không được để trống.");

            if (request.Size.HasValue && request.Size.Value <= 0)
                throw new BadRequestException("Diện tích khu vực phải lớn hơn 0.");

            // Check duplicate name in the same market
            var nameLower = request.Name.Trim().ToLower();
            var isDuplicateName = await _areaRepository.Query()
                .AnyAsync(a => a.MarketId == request.MarketId && a.Name.ToLower() == nameLower && a.IsDeleted != true);
            
            if (isDuplicateName)
                throw new BadRequestException("Tên khu vực này đã tồn tại trong chợ. Vui lòng chọn tên khác.");

            var area = _mapper.Map<Area>(request);
            
            var resolvedCategoryId = await ResolveCategoryAsync(request.CategoryId, request.CategoryName);
            if (resolvedCategoryId.HasValue)
            {
                area.CategoryId = resolvedCategoryId.Value;
            }
            
            area.CreatedAt = DateTime.UtcNow;
            area.IsDeleted = false;

            await _areaRepository.AddAsync(area);
            await _areaRepository.SaveChangesAsync();

            var createdArea = await _areaRepository.GetAreaByIdAsync(area.AreaId);
            return _mapper.Map<AreaDto>(createdArea!);
        }

        public async Task<AreaDto> UpdateAreaAsync(int id, UpdateAreaRequest request)
        {
            if (id <= 0)
                throw new BadRequestException("ID Khu vực không hợp lệ.");

            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                throw new NotFoundException("Khu vực không tồn tại.");
            }

            if (request.Name != null && string.IsNullOrWhiteSpace(request.Name))
            {
                throw new BadRequestException("Tên khu vực không được để trống.");
            }

            if (request.Size.HasValue && request.Size.Value <= 0)
            {
                throw new BadRequestException("Diện tích khu vực phải lớn hơn 0.");
            }

            // Check duplicate name if name is provided and different from current
            if (!string.IsNullOrWhiteSpace(request.Name) && 
                !request.Name.Equals(existingArea.Name, StringComparison.OrdinalIgnoreCase))
            {
                var nameLower = request.Name.Trim().ToLower();
                var isDuplicateName = await _areaRepository.Query()
                    .AnyAsync(a => a.MarketId == existingArea.MarketId && a.Name.ToLower() == nameLower && a.IsDeleted != true && a.AreaId != id);
                
                if (isDuplicateName)
                    throw new BadRequestException("Tên khu vực này đã tồn tại trong chợ. Vui lòng chọn tên khác.");
            }

            var hasStalls = await _stallRepository.Query().AnyAsync(s => s.AreaId == id && s.IsDeleted != true);
            var resolvedCategoryId = await ResolveCategoryAsync(request.CategoryId, request.CategoryName);

            if (hasStalls)
            {
                if (resolvedCategoryId.HasValue && resolvedCategoryId.Value != existingArea.CategoryId)
                {
                    throw new BadRequestException("Không thể thay đổi ngành hàng của khu vực khi đã có sạp bên trong.");
                }

                if ((!string.IsNullOrWhiteSpace(request.SvgPath) && request.SvgPath != existingArea.SvgPath) || 
                    (request.Size.HasValue && Math.Abs(request.Size.Value - (existingArea.Size ?? 0)) > 0.01))
                {
                    throw new BadRequestException("Không thể thay đổi hình dạng/diện tích khu vực khi đã có sạp bên trong.");
                }
            }

            _mapper.Map(request, existingArea);
            
            if (resolvedCategoryId.HasValue)
            {
                existingArea.CategoryId = resolvedCategoryId.Value;
            }

            if (request.Size.HasValue && !hasStalls)
            {
                // Logic kept for safety, although hasStalls == false means totalStallsSize == 0
                var totalStallsSize = await _stallRepository.Query()
                    .Where(s => s.AreaId == id && s.IsDeleted != true)
                    .SumAsync(s => s.Size ?? 0);

                if (request.Size.Value < totalStallsSize)
                {
                    throw new BadRequestException($"Diện tích Khu vực ({request.Size.Value:F2} m²) không được nhỏ hơn tổng diện tích các sạp hiện có ({(totalStallsSize):F2} m²).");
                }
            }
            
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            var updatedArea = await _areaRepository.GetAreaByIdAsync(id);
            return _mapper.Map<AreaDto>(updatedArea!);
        }

        public async Task<bool> DeleteAreaAsync(int id)
        {
            if (id <= 0)
                throw new BadRequestException("ID Khu vực không hợp lệ.");

            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                throw new NotFoundException("Khu vực không tồn tại.");
            }

            // Check if any stall in this area has an active contract
            var hasActiveContracts = await _stallRepository.Query()
                .Include(s => s.Contracts)
                .AnyAsync(s => s.AreaId == id && s.IsDeleted != true && s.Contracts.Any(c => c.Status == "Active"));

            if (hasActiveContracts)
            {
                throw new BadRequestException("Không thể xóa khu vực vì có sạp đang có hợp đồng hiệu lực (có người thuê).");
            }

            existingArea.IsDeleted = true;
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            return true;
        }
    }
}
