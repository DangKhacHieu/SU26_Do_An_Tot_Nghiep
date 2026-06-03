using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using AutoMapper;
using STMM.Business.DTOs.Area;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class AreaService : IAreaService
    {
        private readonly IAreaRepository _areaRepository;
        private readonly IMapper _mapper;

        public AreaService(IAreaRepository areaRepository, IMapper mapper)
        {
            _areaRepository = areaRepository;
            _mapper = mapper;
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

        public async Task<AreaDto> CreateAreaAsync(CreateAreaRequest request)
        {
            var area = _mapper.Map<Area>(request);
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

            existingArea.IsDeleted = true;
            _areaRepository.Update(existingArea);
            await _areaRepository.SaveChangesAsync();

            return true;
        }
    }
}
