using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Area;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public AreaService(IAreaRepository areaRepository, IMapper mapper, AppDbContext context)
        {
            _areaRepository = areaRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<IEnumerable<AreaDto>> GetAllAreasAsync(int? marketId = null)
        {
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
                // We use EF Core directly via AppDbContext to simplify category resolution
                var existingCategory = await _context.Set<BusinessCategory>()
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
                    _context.Set<BusinessCategory>().Add(newCategory);
                    await _context.SaveChangesAsync();
                    return newCategory.CategoryId;
                }
            }
            return categoryId;
        }

        public async Task<AreaDto> CreateAreaAsync(CreateAreaRequest request)
        {
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
            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                throw new Exception("Area not found");
            }

            _mapper.Map(request, existingArea);
            
            var resolvedCategoryId = await ResolveCategoryAsync(request.CategoryId, request.CategoryName);
            if (resolvedCategoryId.HasValue)
            {
                existingArea.CategoryId = resolvedCategoryId.Value;
            }
            
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            var updatedArea = await _areaRepository.GetAreaByIdAsync(id);
            return _mapper.Map<AreaDto>(updatedArea!);
        }

        public async Task<bool> DeleteAreaAsync(int id)
        {
            var existingArea = await _areaRepository.GetAreaByIdAsync(id);
            if (existingArea == null)
            {
                return false;
            }

            // Check if any stall in this area has an active contract
            var hasActiveContracts = await _context.Stalls
                .Include(s => s.Contracts)
                .AnyAsync(s => s.AreaId == id && s.IsDeleted != true && s.Contracts.Any(c => c.Status == "Active"));

            if (hasActiveContracts)
            {
                throw new InvalidOperationException("Không thể xóa khu vực vì có sạp đang có hợp đồng hiệu lực (có người thuê).");
            }

            existingArea.IsDeleted = true;
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            return true;
        }
    }
}
