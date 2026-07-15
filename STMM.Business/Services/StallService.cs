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
                .Include(s => s.Meters)
                    .ThenInclude(m => m.MeterReadings)
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

                var electricityMeter = stalls[i].Meters.FirstOrDefault(m => m.Type == "Electricity" && m.IsActive == true);
                if (electricityMeter != null)
                {
                    dtos[i].ElectricityMeterSerial = electricityMeter.SerialNumber;
                    var latestReading = electricityMeter.MeterReadings.OrderByDescending(r => r.RecordedAt).FirstOrDefault();
                    if (latestReading != null) dtos[i].CurrentElectricityIndex = latestReading.NewValue;
                }

                var waterMeter = stalls[i].Meters.FirstOrDefault(m => m.Type == "Water" && m.IsActive == true);
                if (waterMeter != null)
                {
                    dtos[i].WaterMeterSerial = waterMeter.SerialNumber;
                    var latestReading = waterMeter.MeterReadings.OrderByDescending(r => r.RecordedAt).FirstOrDefault();
                    if (latestReading != null) dtos[i].CurrentWaterIndex = latestReading.NewValue;
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
                .Include(s => s.Meters)
                    .ThenInclude(m => m.MeterReadings)
                .FirstOrDefaultAsync(s => s.StallId == id && s.IsDeleted != true);

            if (stall == null) return null;

            var dto = _mapper.Map<StallDto>(stall);
            var activeContract = stall.Contracts.FirstOrDefault(c => c.Status == "Active");
            if (activeContract != null)
            {
                dto.Status = "Rented";
                dto.TenantName = activeContract.Vendor?.BusinessName;
            }

            var electricityMeter = stall.Meters.FirstOrDefault(m => m.Type == "Electricity" && m.IsActive == true);
            if (electricityMeter != null)
            {
                dto.ElectricityMeterSerial = electricityMeter.SerialNumber;
                var latestReading = electricityMeter.MeterReadings.OrderByDescending(r => r.RecordedAt).FirstOrDefault();
                if (latestReading != null) dto.CurrentElectricityIndex = latestReading.NewValue;
            }

            var waterMeter = stall.Meters.FirstOrDefault(m => m.Type == "Water" && m.IsActive == true);
            if (waterMeter != null)
            {
                dto.WaterMeterSerial = waterMeter.SerialNumber;
                var latestReading = waterMeter.MeterReadings.OrderByDescending(r => r.RecordedAt).FirstOrDefault();
                if (latestReading != null) dto.CurrentWaterIndex = latestReading.NewValue;
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
                        Code = GetAcronym(categoryName) + "-" + Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper(),
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

        private async Task ValidateStallSizeAsync(Stall stall)
        {
            if (stall.Size.HasValue)
            {
                if (stall.Size.Value <= 0)
                    throw new ArgumentException("Diện tích sạp phải lớn hơn 0 m².");

                var area = await _context.Areas.FindAsync(stall.AreaId);
                if (area?.Size.HasValue == true)
                {
                    var existingSize = await _context.Stalls
                        .Where(s => s.AreaId == stall.AreaId && s.IsDeleted != true && s.StallId != stall.StallId)
                        .SumAsync(s => s.Size ?? 0);

                    if (existingSize + stall.Size.Value > area.Size.Value)
                    {
                        throw new ArgumentException($"Tổng diện tích các sạp ({(existingSize + stall.Size.Value):F2} m²) vượt quá diện tích Khu vực ({area.Size.Value:F2} m²).");
                    }
                }
            }
        }

        private string GetAcronym(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "";
            var cleanName = name.Replace("Chợ", "", StringComparison.OrdinalIgnoreCase)
                                .Replace("Khu", "", StringComparison.OrdinalIgnoreCase)
                                .Trim();
            var words = cleanName.Split(new[] { ' ', '-' }, StringSplitOptions.RemoveEmptyEntries);
            return string.Join("", words.Select(w => w[0].ToString().ToUpper()));
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

            await ValidateStallSizeAsync(stall);

            var area = await _context.Areas.Include(a => a.Market).FirstOrDefaultAsync(a => a.AreaId == stall.AreaId);
            if (area != null)
            {
                var marketAcronym = GetAcronym(area.Market.MarketName);
                var areaAcronym = GetAcronym(area.Name);
                
                int seq = 1;
                string generatedCode = $"{marketAcronym}-{areaAcronym}{seq:D2}";
                while (await _context.Stalls.AnyAsync(s => s.Code == generatedCode && s.Area.MarketId == area.MarketId))
                {
                    seq++;
                    generatedCode = $"{marketAcronym}-{areaAcronym}{seq:D2}";
                }
                stall.Code = generatedCode;
            }
            else
            {
                stall.Code = createStallDto.Code ?? ("S-" + Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper());
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

            // Assign meters if selected
            if (createStallDto.ElectricityMeterId.HasValue)
            {
                var eMeter = await _context.Meters.FindAsync(createStallDto.ElectricityMeterId.Value);
                if (eMeter != null && eMeter.StallId == null)
                {
                    eMeter.StallId = stall.StallId;
                }
            }
            if (createStallDto.WaterMeterId.HasValue)
            {
                var wMeter = await _context.Meters.FindAsync(createStallDto.WaterMeterId.Value);
                if (wMeter != null && wMeter.StallId == null)
                {
                    wMeter.StallId = stall.StallId;
                }
            }
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

            await ValidateStallSizeAsync(stall);

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

            if (locationDto.Size.HasValue)
            {
                stall.Size = locationDto.Size.Value;
                await ValidateStallSizeAsync(stall);
            }

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
