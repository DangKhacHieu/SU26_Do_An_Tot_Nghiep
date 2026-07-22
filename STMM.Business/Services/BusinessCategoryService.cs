using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.BusinessCategory;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class BusinessCategoryService : IBusinessCategoryService
    {
        private readonly IBusinessCategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public BusinessCategoryService(
            IBusinessCategoryRepository categoryRepository,
            IMapper mapper,
            AppDbContext context)
        {
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<IEnumerable<BusinessCategoryDto>> GetAllCategoriesAsync(string? searchTerm, bool? isActive, int? currentUserId = null, CancellationToken ct = default)
        {
            int? managerMarketId = null;
            bool isManagerWithoutMarket = false;
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue)
                    {
                        isManagerWithoutMarket = true;
                    }
                    else
                    {
                        managerMarketId = user.MarketId.Value;
                    }
                }
            }

            if (isManagerWithoutMarket)
            {
                return new List<BusinessCategoryDto>();
            }

            var categories = await _categoryRepository.GetAllCategoriesAsync(searchTerm, isActive, managerMarketId, ct);

            var dtos = new List<BusinessCategoryDto>();
            foreach (var cat in categories)
            {
                var dto = _mapper.Map<BusinessCategoryDto>(cat);
                if (managerMarketId.HasValue)
                {
                    dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == cat.CategoryId && s.Area.MarketId == managerMarketId.Value && s.IsDeleted != true, ct);
                    dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == cat.CategoryId && a.MarketId == managerMarketId.Value && a.IsDeleted != true, ct);
                }
                else
                {
                    dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == cat.CategoryId && s.IsDeleted != true, ct);
                    dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == cat.CategoryId && a.IsDeleted != true, ct);
                }
                dtos.Add(dto);
            }

            return dtos;
        }

        public async Task<BusinessCategoryDto?> GetCategoryByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            int? managerMarketId = null;
            bool isManagerWithoutMarket = false;
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue)
                    {
                        isManagerWithoutMarket = true;
                    }
                    else
                    {
                        managerMarketId = user.MarketId.Value;
                    }
                }
            }

            if (isManagerWithoutMarket)
            {
                return null;
            }

            var category = await _categoryRepository.GetCategoryByIdAsync(id, ct);
            if (category == null) return null;

            var dto = _mapper.Map<BusinessCategoryDto>(category);
            if (managerMarketId.HasValue)
            {
                dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == id && s.Area.MarketId == managerMarketId.Value && s.IsDeleted != true, ct);
                dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == id && a.MarketId == managerMarketId.Value && a.IsDeleted != true, ct);
            }
            else
            {
                dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == id && s.IsDeleted != true, ct);
                dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == id && a.IsDeleted != true, ct);
            }
            return dto;
        }

        public async Task<BusinessCategoryDto> CreateCategoryAsync(CreateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            int? targetMarketId = null;
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
                {
                    if (!user.MarketId.HasValue)
                    {
                        throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt. Bạn chỉ có thể tạo danh mục kinh doanh sau khi chợ được phê duyệt.");
                    }
                    targetMarketId = user.MarketId.Value;
                }
            }

            // Check code uniqueness globally (DB enforces unique constraint on Code column)
            var codeUpper = request.Code.Trim().ToUpper();
            var codeExists = await _context.BusinessCategories.AnyAsync(c => c.Code.ToUpper() == codeUpper, ct);
            if (codeExists)
            {
                throw new InvalidOperationException($"Mã code '{codeUpper}' đã tồn tại trong hệ thống. Vui lòng chọn mã code khác.");
            }

            // Check name uniqueness per market
            var nameTrim = request.Name.Trim().ToLower();
            var nameExists = await _context.BusinessCategories.AnyAsync(c => c.Name.ToLower() == nameTrim && c.MarketId == targetMarketId, ct);
            if (nameExists)
            {
                throw new InvalidOperationException("Tên ngành hàng này đã tồn tại trong chợ.");
            }

            var category = _mapper.Map<BusinessCategory>(request);
            category.Code = codeUpper;
            category.MarketId = targetMarketId;
            category.CreatedAt = DateTime.UtcNow;

            await _categoryRepository.AddAsync(category, ct);
            try
            {
                await _categoryRepository.SaveChangesAsync(ct);
            }
            catch (DbUpdateException ex)
            {
                if (ex.InnerException?.Message.Contains("business_categories_code_key") == true || ex.InnerException?.Message.Contains("duplicate key") == true)
                {
                    throw new InvalidOperationException($"Mã code '{codeUpper}' đã tồn tại trong hệ thống. Vui lòng chọn mã code khác.");
                }
                throw new InvalidOperationException($"Lỗi khi lưu danh mục ngành hàng: {ex.InnerException?.Message ?? ex.Message}");
            }

            return _mapper.Map<BusinessCategoryDto>(category);
        }

        public async Task<BusinessCategoryDto> UpdateCategoryAsync(int id, UpdateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase) && !user.MarketId.HasValue)
                {
                    throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
                }
            }

            var category = await _categoryRepository.GetCategoryByIdAsync(id, ct);
            if (category == null)
            {
                throw new KeyNotFoundException("Không tìm thấy danh mục kinh doanh.");
            }

            // Check name uniqueness if changed
            var nameTrim = request.Name.Trim().ToLower();
            if (category.Name.ToLower() != nameTrim)
            {
                var nameExists = await _context.BusinessCategories.AnyAsync(c => c.Name.ToLower() == nameTrim && c.CategoryId != id && c.MarketId == category.MarketId, ct);
                if (nameExists)
                {
                    throw new InvalidOperationException("Tên ngành hàng này đã tồn tại trong chợ.");
                }
            }

            _mapper.Map(request, category);
            
            _categoryRepository.Update(category);
            await _categoryRepository.SaveChangesAsync(ct);

            var dto = _mapper.Map<BusinessCategoryDto>(category);
            dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == id && s.IsDeleted != true, ct);
            dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == id && a.IsDeleted != true, ct);
            return dto;
        }

        public async Task<bool> DeleteCategoryAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            if (currentUserId.HasValue)
            {
                var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
                if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase) && !user.MarketId.HasValue)
                {
                    throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
                }
            }

            var category = await _categoryRepository.GetCategoryByIdAsync(id, ct);
            if (category == null) return false;

            // Check if there are active stalls or areas assigned to this category
            var stallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == id && s.IsDeleted != true, ct);
            var areasCount = await _context.Areas.CountAsync(a => a.CategoryId == id && a.IsDeleted != true, ct);

            if (stallsCount > 0 || areasCount > 0)
            {
                throw new InvalidOperationException("Không thể xóa danh mục ngành hàng này vì đã có quầy sạp hoặc khu vực đang sử dụng.");
            }

            _categoryRepository.Delete(category);
            await _categoryRepository.SaveChangesAsync(ct);
            return true;
        }
    }
}
