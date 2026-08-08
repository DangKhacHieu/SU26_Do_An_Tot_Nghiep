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
        private readonly IMarketRepository _marketRepository;
        private readonly IMapper _mapper;

        public AreaService(
            IAreaRepository areaRepository, 
            IBusinessCategoryRepository categoryRepository,
            IStallRepository stallRepository,
            IUserRepository userRepository,
            IMarketRepository marketRepository,
            IMapper mapper)
        {
            _areaRepository = areaRepository;
            _categoryRepository = categoryRepository;
            _stallRepository = stallRepository;
            _userRepository = userRepository;
            _marketRepository = marketRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<AreaDto>> GetAllAreasAsync(int? marketId = null, int? currentUserId = null)
        {
            if (marketId.HasValue && marketId.Value <= 0)
                throw new BadRequestException("ERR_ID_CHO_KHONG_HOP_LE");

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

        private async Task ValidateAreaSizeAsync(Area area)
        {
            if (area.Size.HasValue)
            {
                if (area.Size.Value <= 0)
                    throw new BadRequestException("ERR_DIEN_TICH_KHU_VUC_PHAI_LON_HON_0");

                var market = await _marketRepository.GetByIdAsync(area.MarketId);
                if (market?.Size.HasValue == true)
                {
                    var existingSize = await _areaRepository.Query()
                        .Where(a => a.MarketId == area.MarketId && a.AreaId != area.AreaId && a.IsDeleted != true)
                        .SumAsync(a => a.Size ?? 0);

                    if (existingSize + area.Size.Value > market.Size.Value)
                    {
                        throw new BadRequestException($"ERR_TONG_DIEN_TICH_CAC_KHU_VUC_EXISTINGSIZE_AREA_SIZE|{(existingSize + area.Size.Value):F2}|{market.Size.Value:F2}");
                    }
                }
            }
        }

        public async Task<AreaDto> CreateAreaAsync(CreateAreaRequest request)
        {
            if (request.MarketId <= 0)
                throw new BadRequestException("ERR_ID_CHO_KHONG_HOP_LE");

            var market = await _marketRepository.GetByIdAsync(request.MarketId);
            if (market == null || market.IsDeleted == true)
                throw new NotFoundException("ERR_CHO_KHONG_TON_TAI_HOAC_DA_BI_XOA");

            if (market.Status != "Active")
                throw new BadRequestException($"ERR_KHONG_THE_THEM_KHU_VUC_VAO_CHO_DANG_O_TRANG_THAI_M|{market.Status}");

            if (string.IsNullOrWhiteSpace(request.Name))
                throw new BadRequestException("ERR_TEN_KHU_VUC_KHONG_DUOC_DE_TRONG");

            if (request.Size.HasValue && request.Size.Value <= 0)
                throw new BadRequestException("ERR_DIEN_TICH_KHU_VUC_PHAI_LON_HON_0");

            // Check duplicate name in the same market
            var nameLower = request.Name.Trim().ToLower();
            var isDuplicateName = await _areaRepository.Query()
                .AnyAsync(a => a.MarketId == request.MarketId && a.Name.ToLower() == nameLower && a.IsDeleted != true);
            
            if (isDuplicateName)
                throw new BadRequestException("ERR_TEN_KHU_VUC_NAY_DA_TON_TAI_TRONG_CHO_VUI_LONG_CHON");

            var area = _mapper.Map<Area>(request);
            
            var resolvedCategoryId = await ResolveCategoryAsync(request.CategoryId, request.CategoryName);
            if (resolvedCategoryId.HasValue)
            {
                area.CategoryId = resolvedCategoryId.Value;
            }
            
            area.CreatedAt = DateTime.UtcNow;
            area.IsDeleted = false;
            
            await ValidateAreaSizeAsync(area);

            await _areaRepository.AddAsync(area);
            await _areaRepository.SaveChangesAsync();

            var createdArea = await _areaRepository.GetAreaByIdAsync(area.AreaId);
            return _mapper.Map<AreaDto>(createdArea!);
        }

        public async Task<AreaDto> UpdateAreaAsync(int id, UpdateAreaRequest request)
        {
            if (id <= 0)
                throw new BadRequestException("ERR_ID_KHU_VUC_KHONG_HOP_LE");

            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                throw new NotFoundException("ERR_KHU_VUC_KHONG_TON_TAI");
            }

            var market = await _marketRepository.GetByIdAsync(existingArea.MarketId);
            if (market == null || market.IsDeleted == true)
            {
                throw new NotFoundException("ERR_CHO_CUA_KHU_VUC_NAY_KHONG_TON_TAI");
            }

            if (market.Status != "Active")
            {
                throw new BadRequestException($"ERR_KHONG_THE_CHINH_SUA_KHU_VUC_THUOC_CHO_DANG_O_TRANG|{market.Status}");
            }

            if (request.Name != null && string.IsNullOrWhiteSpace(request.Name))
            {
                throw new BadRequestException("ERR_TEN_KHU_VUC_KHONG_DUOC_DE_TRONG");
            }

            if (request.Size.HasValue && request.Size.Value <= 0)
            {
                throw new BadRequestException("ERR_DIEN_TICH_KHU_VUC_PHAI_LON_HON_0");
            }

            // Check duplicate name if name is provided and different from current
            if (!string.IsNullOrWhiteSpace(request.Name) && 
                !request.Name.Equals(existingArea.Name, StringComparison.OrdinalIgnoreCase))
            {
                var nameLower = request.Name.Trim().ToLower();
                var isDuplicateName = await _areaRepository.Query()
                    .AnyAsync(a => a.MarketId == existingArea.MarketId && a.Name.ToLower() == nameLower && a.IsDeleted != true && a.AreaId != id);
                
                if (isDuplicateName)
                    throw new BadRequestException("ERR_TEN_KHU_VUC_NAY_DA_TON_TAI_TRONG_CHO_VUI_LONG_CHON");
            }

            var hasStalls = await _stallRepository.Query().AnyAsync(s => s.AreaId == id && s.IsDeleted != true);
            var resolvedCategoryId = await ResolveCategoryAsync(request.CategoryId, request.CategoryName);

            if (hasStalls)
            {
                if (resolvedCategoryId.HasValue && resolvedCategoryId.Value != existingArea.CategoryId)
                {
                    throw new BadRequestException("ERR_KHONG_THE_THAY_DOI_NGANH_HANG_CUA_KHU_VUC_KHI_DA_C");
                }

                if ((!string.IsNullOrWhiteSpace(request.SvgPath) && request.SvgPath != existingArea.SvgPath) || 
                    (request.Size.HasValue && Math.Abs(request.Size.Value - (existingArea.Size ?? 0)) > 0.01))
                {
                    throw new BadRequestException("ERR_KHONG_THE_THAY_DOI_HINH_DANG_DIEN_TICH_KHU_VUC_KHI");
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
                    throw new BadRequestException($"ERR_DIEN_TICH_KHU_VUC_REQUEST_SIZE_VALUE_F2_M_KHONG_DU|{request.Size.Value:F2}|{(totalStallsSize):F2}");
                }
            }
            
            await ValidateAreaSizeAsync(existingArea);
            
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            var updatedArea = await _areaRepository.GetAreaByIdAsync(id);
            return _mapper.Map<AreaDto>(updatedArea!);
        }

        public async Task<bool> DeleteAreaAsync(int id)
        {
            if (id <= 0)
                throw new BadRequestException("ERR_ID_KHU_VUC_KHONG_HOP_LE");

            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                throw new NotFoundException("ERR_KHU_VUC_KHONG_TON_TAI");
            }

            var market = await _marketRepository.GetByIdAsync(existingArea.MarketId);
            if (market == null || market.IsDeleted == true)
            {
                throw new NotFoundException("ERR_CHO_CUA_KHU_VUC_NAY_KHONG_TON_TAI");
            }

            if (market.Status != "Active")
            {
                throw new BadRequestException($"ERR_KHONG_THE_XOA_KHU_VUC_THUOC_CHO_DANG_O_TRANG_THAI|{market.Status}");
            }

            // Check if any stall in this area has an active contract
            var hasActiveContracts = await _stallRepository.Query()
                .Include(s => s.Contracts)
                .AnyAsync(s => s.AreaId == id && s.IsDeleted != true && s.Contracts.Any(c => c.Status == "Active"));

            if (hasActiveContracts)
            {
                throw new BadRequestException("ERR_KHONG_THE_XOA_KHU_VUC_VI_CO_SAP_DANG_CO_HOP_DONG_H");
            }

            existingArea.IsDeleted = true;
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            return true;
        }
    }
}
