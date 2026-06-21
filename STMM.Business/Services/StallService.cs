using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Stall;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;

namespace STMM.Business.Services
{
    public class StallService : IStallService
    {
        private readonly AppDbContext _context;
        private readonly IMapper _mapper;

        public StallService(AppDbContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<StallDto>> GetAllStallsAsync()
        {
            var stalls = await _context.Stalls
                .Include(s => s.Area)
                .Include(s => s.Category)
                .Where(s => s.IsDeleted != true)
                .ToListAsync();

            return _mapper.Map<IEnumerable<StallDto>>(stalls);
        }

        public async Task<IEnumerable<StallDto>> GetAllStallsByAreaIdAsync(int areaId)
        {
            var stalls = await _context.Stalls
                .Include(s => s.Area)
                .Include(s => s.Category)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                .Where(s => s.AreaId == areaId && s.IsDeleted != true)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<StallDto>>(stalls).ToList();
            
            for(int i = 0; i < stalls.Count; i++)
            {
                var activeContract = stalls[i].Contracts.FirstOrDefault(c => c.Status == "Active");
                if (activeContract != null)
                {
                    dtos[i].Status = "Rented";
                    dtos[i].TenantName = activeContract.Vendor?.BusinessName;
                }
            }

            return dtos;
        }

        public async Task<StallDto?> GetStallByIdAsync(int id)
        {
            var stall = await _context.Stalls
                .Include(s => s.Area)
                .Include(s => s.Category)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                .FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);

            if (stall == null) return null;

            var dto = _mapper.Map<StallDto>(stall);
            var activeContract = stall.Contracts.FirstOrDefault(c => c.Status == "Active");
            if (activeContract != null)
            {
                dto.Status = "Rented";
                dto.TenantName = activeContract.Vendor?.BusinessName;
            }

            return dto;
        }

        private async Task<int?> ResolveCategoryAsync(int? categoryId, string? categoryName)
        {
            if (!string.IsNullOrWhiteSpace(categoryName))
            {
                var nameLower = categoryName.ToLower().Trim();
                var existingCategory = await _context.BusinessCategories
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
                    _context.BusinessCategories.Add(newCategory);
                    await _context.SaveChangesAsync();
                    return newCategory.CategoryId;
                }
            }
            return categoryId;
        }

        public async Task<StallDto> CreateStallAsync(CreateStallDto createStallDto)
        {
            var stall = _mapper.Map<Stall>(createStallDto);
            
            // Resolve Category Name to ID
            var resolvedCategoryId = await ResolveCategoryAsync(createStallDto.CategoryId, createStallDto.CategoryName);
            if (resolvedCategoryId.HasValue)
            {
                stall.CategoryId = resolvedCategoryId.Value;
            }

            stall.CreatedAt = DateTime.UtcNow;
            stall.IsDeleted = false;
            
            // Set default sizes if not provided
            stall.Width ??= 100;
            stall.Height ??= 100;
            stall.MapX ??= 0;
            stall.MapY ??= 0;

            _context.Stalls.Add(stall);
            await _context.SaveChangesAsync();

            // Auto-create Electricity and Water meters
            var electricityMeter = new Meter
            {
                StallId = stall.StallId,
                Type = "Electricity",
                SerialNumber = "E-" + stall.Code,
                IsActive = true,
                InstalledAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };
            var waterMeter = new Meter
            {
                StallId = stall.StallId,
                Type = "Water",
                SerialNumber = "W-" + stall.Code,
                IsActive = true,
                InstalledAt = DateOnly.FromDateTime(DateTime.UtcNow)
            };

            _context.Meters.AddRange(electricityMeter, waterMeter);
            await _context.SaveChangesAsync();

            return await GetStallByIdAsync(stall.StallId) ?? _mapper.Map<StallDto>(stall);
        }

        public async Task<StallDto> UpdateStallAsync(int id, UpdateStallDto updateStallDto)
        {
            var stall = await _context.Stalls.FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);
            if (stall == null)
            {
                throw new KeyNotFoundException($"Stall with id {id} not found.");
            }

            _mapper.Map(updateStallDto, stall);
            
            // Resolve Category Name to ID
            var resolvedCategoryId = await ResolveCategoryAsync(updateStallDto.CategoryId, updateStallDto.CategoryName);
            if (resolvedCategoryId.HasValue)
            {
                stall.CategoryId = resolvedCategoryId.Value;
            }

            // Force status to Rented if there is an active contract
            if (await _context.Contracts.AnyAsync(c => c.StallId == id && c.Status == "Active"))
            {
                stall.Status = "Rented";
            }

            await _context.SaveChangesAsync();

            return await GetStallByIdAsync(id) ?? _mapper.Map<StallDto>(stall);
        }

        public async Task<StallDto> UpdateStallLocationAsync(int id, UpdateStallLocationDto locationDto)
        {
            var stall = await _context.Stalls.FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);
            if (stall == null)
            {
                throw new KeyNotFoundException($"Stall with id {id} not found.");
            }

            if (locationDto.MapX.HasValue) stall.MapX = locationDto.MapX;
            if (locationDto.MapY.HasValue) stall.MapY = locationDto.MapY;
            if (locationDto.Width.HasValue) stall.Width = locationDto.Width;
            if (locationDto.Height.HasValue) stall.Height = locationDto.Height;
            if (locationDto.Rotation.HasValue) stall.Rotation = locationDto.Rotation;

            await _context.SaveChangesAsync();

            return await GetStallByIdAsync(id) ?? _mapper.Map<StallDto>(stall);
        }

        public async Task<StallDto> UpdateStallStatusAsync(int id, string status)
        {
            var stall = await _context.Stalls.FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);
            if (stall == null)
            {
                throw new KeyNotFoundException($"Stall with id {id} not found.");
            }

            stall.Status = status;
            await _context.SaveChangesAsync();

            return await GetStallByIdAsync(id) ?? _mapper.Map<StallDto>(stall);
        }

        public async Task<bool> DeactivateStallAsync(int id)
        {
            var stall = await _context.Stalls
                .Include(s => s.Contracts)
                .FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);
            
            if (stall == null)
            {
                return false;
            }

            if (stall.Contracts.Any(c => c.Status == "Active"))
            {
                throw new InvalidOperationException("Không thể xóa sạp vì sạp đang có hợp đồng hiệu lực (có người thuê).");
            }

            stall.IsDeleted = true;
            stall.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<HighestRatedStallDto?> GetHighestRatedStallAsync()
        {
            // Find the stall with the highest average rating
            var highestRatedGroup = await _context.Reviews
                .GroupBy(r => r.StallId)
                .Select(g => new
                {
                    StallId = g.Key,
                    AverageRating = g.Average(r => r.Rating)
                })
                .OrderByDescending(x => x.AverageRating)
                .FirstOrDefaultAsync();

            Stall? stall = null;
            double avgRating = 5.0; // default fallback

            if (highestRatedGroup != null)
            {
                stall = await _context.Stalls
                    .Include(s => s.Area)
                    .Include(s => s.Category)
                    .FirstOrDefaultAsync(s => s.StallId == highestRatedGroup.StallId && s.IsDeleted != true);
                
                avgRating = Math.Round(highestRatedGroup.AverageRating, 1);
            }

            // Fallback: get the first rented stall
            if (stall == null)
            {
                stall = await _context.Stalls
                    .Include(s => s.Area)
                    .Include(s => s.Category)
                    .FirstOrDefaultAsync(s => s.IsDeleted != true && s.Status == "Rented");

                if (stall == null)
                {
                    stall = await _context.Stalls
                        .Include(s => s.Area)
                        .Include(s => s.Category)
                        .FirstOrDefaultAsync(s => s.IsDeleted != true);
                }
            }

            if (stall == null)
            {
                return null;
            }

            var dto = _mapper.Map<HighestRatedStallDto>(stall);
            dto.AverageRating = avgRating;
            return dto;
        }
    }
}
