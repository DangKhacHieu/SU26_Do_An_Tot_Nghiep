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

        public async Task<IEnumerable<BusinessCategoryDto>> GetAllCategoriesAsync(string? searchTerm, bool? isActive, CancellationToken ct)
        {
            var categories = await _categoryRepository.GetAllCategoriesAsync(searchTerm, isActive, ct);

            var dtos = new List<BusinessCategoryDto>();
            foreach (var cat in categories)
            {
                var dto = _mapper.Map<BusinessCategoryDto>(cat);
                dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == cat.CategoryId && s.IsDeleted != true, ct);
                dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == cat.CategoryId && a.IsDeleted != true, ct);
                dtos.Add(dto);
            }

            return dtos;
        }

        public async Task<BusinessCategoryDto?> GetCategoryByIdAsync(int id, CancellationToken ct)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(id, ct);
            if (category == null) return null;

            var dto = _mapper.Map<BusinessCategoryDto>(category);
            dto.StallsCount = await _context.Stalls.CountAsync(s => s.CategoryId == id && s.IsDeleted != true, ct);
            dto.AreasCount = await _context.Areas.CountAsync(a => a.CategoryId == id && a.IsDeleted != true, ct);
            return dto;
        }

        public async Task<BusinessCategoryDto> CreateCategoryAsync(CreateBusinessCategoryRequest request, CancellationToken ct)
        {
            // Check code uniqueness
            var codeUpper = request.Code.Trim().ToUpper();
            var codeExists = await _context.BusinessCategories.AnyAsync(c => c.Code.ToUpper() == codeUpper, ct);
            if (codeExists)
            {
                throw new InvalidOperationException("Mã ngành hàng này đã tồn tại trong hệ thống.");
            }

            // Check name uniqueness
            var nameTrim = request.Name.Trim().ToLower();
            var nameExists = await _context.BusinessCategories.AnyAsync(c => c.Name.ToLower() == nameTrim, ct);
            if (nameExists)
            {
                throw new InvalidOperationException("Tên ngành hàng này đã tồn tại.");
            }

            var category = _mapper.Map<BusinessCategory>(request);
            category.Code = codeUpper;
            category.CreatedAt = DateTime.UtcNow;

            await _categoryRepository.AddAsync(category, ct);
            await _categoryRepository.SaveChangesAsync(ct);

            return _mapper.Map<BusinessCategoryDto>(category);
        }

        public async Task<BusinessCategoryDto> UpdateCategoryAsync(int id, UpdateBusinessCategoryRequest request, CancellationToken ct)
        {
            var category = await _categoryRepository.GetCategoryByIdAsync(id, ct);
            if (category == null)
            {
                throw new KeyNotFoundException("Không tìm thấy danh mục kinh doanh.");
            }

            // Check name uniqueness if changed
            var nameTrim = request.Name.Trim().ToLower();
            if (category.Name.ToLower() != nameTrim)
            {
                var nameExists = await _context.BusinessCategories.AnyAsync(c => c.Name.ToLower() == nameTrim && c.CategoryId != id, ct);
                if (nameExists)
                {
                    throw new InvalidOperationException("Tên ngành hàng này đã tồn tại.");
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

        public async Task<bool> DeleteCategoryAsync(int id, CancellationToken ct)
        {
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
