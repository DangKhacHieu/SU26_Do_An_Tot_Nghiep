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

        /// <summary>
        /// Retrieves manager market information for context validation and filtering.
        /// </summary>
        private async Task<(int? marketId, bool isManagerWithoutMarket)> GetManagerMarketContextAsync(int? currentUserId, CancellationToken ct)
        {
            if (!currentUserId.HasValue) return (null, false);

            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);

            if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
            {
                if (!user.MarketId.HasValue)
                {
                    return (null, true);
                }
                return (user.MarketId.Value, false);
            }

            return (null, false);
        }

        /// <summary>
        /// Gets all business categories with optional filtering and aggregated counts for stalls and areas.
        /// </summary>
        public async Task<IEnumerable<BusinessCategoryDto>> GetAllCategoriesAsync(
            string? searchTerm, 
            bool? isActive, 
            int? currentUserId = null, 
            CancellationToken ct = default)
        {
            var (managerMarketId, isManagerWithoutMarket) = await GetManagerMarketContextAsync(currentUserId, ct);
            if (isManagerWithoutMarket)
            {
                return Enumerable.Empty<BusinessCategoryDto>();
            }

            var categories = (await _categoryRepository.GetAllCategoriesAsync(searchTerm, isActive, managerMarketId, ct)).ToList();
            if (!categories.Any())
            {
                return Enumerable.Empty<BusinessCategoryDto>();
            }

            var categoryIds = categories.Select(c => c.CategoryId).ToList();

            // Optimized batch count queries to avoid N+1 database roundtrips
            var stallCountsQuery = _context.Stalls
                .Where(s => categoryIds.Contains(s.CategoryId) && s.IsDeleted != true);
            
            if (managerMarketId.HasValue)
            {
                stallCountsQuery = stallCountsQuery.Where(s => s.Area.MarketId == managerMarketId.Value);
            }

            var stallCounts = await stallCountsQuery
                .GroupBy(s => s.CategoryId)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count, ct);

            var areaCountsQuery = _context.Areas
                .Where(a => a.CategoryId.HasValue && categoryIds.Contains(a.CategoryId.Value) && a.IsDeleted != true);
            
            if (managerMarketId.HasValue)
            {
                areaCountsQuery = areaCountsQuery.Where(a => a.MarketId == managerMarketId.Value);
            }

            var areaCounts = await areaCountsQuery
                .GroupBy(a => a.CategoryId!.Value)
                .Select(g => new { CategoryId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.CategoryId, x => x.Count, ct);

            return categories.Select(cat =>
            {
                var dto = _mapper.Map<BusinessCategoryDto>(cat);
                dto.StallsCount = stallCounts.TryGetValue(cat.CategoryId, out var sCount) ? sCount : 0;
                dto.AreasCount = areaCounts.TryGetValue(cat.CategoryId, out var aCount) ? aCount : 0;
                return dto;
            }).ToList();
        }

        /// <summary>
        /// Retrieves detailed information for a specific business category by ID.
        /// </summary>
        public async Task<BusinessCategoryDto?> GetCategoryByIdAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            var (managerMarketId, isManagerWithoutMarket) = await GetManagerMarketContextAsync(currentUserId, ct);
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

        /// <summary>
        /// Creates a new business category associated with the manager's market.
        /// </summary>
        public async Task<BusinessCategoryDto> CreateCategoryAsync(CreateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var (targetMarketId, isManagerWithoutMarket) = await GetManagerMarketContextAsync(currentUserId, ct);
            if (isManagerWithoutMarket)
            {
                throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt. Bạn chỉ có thể tạo danh mục kinh doanh sau khi chợ được phê duyệt.");
            }

            // Check code uniqueness per market (including system-wide/null market)
            var codeUpper = request.Code.Trim().ToUpper();
            var codeExists = await _context.BusinessCategories.AnyAsync(c => c.Code.ToUpper() == codeUpper && c.MarketId == targetMarketId, ct);
            if (codeExists)
            {
                if (targetMarketId.HasValue)
                {
                    throw new InvalidOperationException($"Mã code '{codeUpper}' đã tồn tại trong chợ này. Vui lòng chọn mã code khác.");
                }
                else
                {
                    throw new InvalidOperationException($"Mã code '{codeUpper}' đã tồn tại trong danh mục mặc định của hệ thống. Vui lòng chọn mã code khác.");
                }
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

        /// <summary>
        /// Updates an existing business category.
        /// </summary>
        public async Task<BusinessCategoryDto> UpdateCategoryAsync(int id, UpdateBusinessCategoryRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var (_, isManagerWithoutMarket) = await GetManagerMarketContextAsync(currentUserId, ct);
            if (isManagerWithoutMarket)
            {
                throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
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

        /// <summary>
        /// Deletes a business category if it is not referenced by active stalls or areas.
        /// </summary>
        public async Task<bool> DeleteCategoryAsync(int id, int? currentUserId = null, CancellationToken ct = default)
        {
            var (_, isManagerWithoutMarket) = await GetManagerMarketContextAsync(currentUserId, ct);
            if (isManagerWithoutMarket)
            {
                throw new InvalidOperationException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt.");
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
