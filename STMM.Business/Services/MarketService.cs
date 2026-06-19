using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Market;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Entities;

namespace STMM.Business.Services
{
    public class MarketService : IMarketService
    {
        private readonly IMarketRepository _marketRepository;
        private readonly IMapper _mapper;

        public MarketService(IMarketRepository marketRepository, IMapper mapper)
        {
            _marketRepository = marketRepository;
            _mapper = mapper;
        }

        public async Task<IEnumerable<MarketDto>> GetAllMarketsAsync()
        {
            var markets = await _marketRepository.Query()
                .Include(m => m.Areas)
                    .ThenInclude(a => a.Stalls)
                .Where(m => m.IsDeleted != true)
                .OrderBy(m => m.MarketId)
                .ToListAsync();

            return _mapper.Map<IEnumerable<MarketDto>>(markets);
        }

        public async Task<MarketMapDto?> GetMarketMapAsync(int marketId)
        {
            var market = await _marketRepository.Query()
                .Include(m => m.Areas.Where(a => a.IsDeleted != true))
                    .ThenInclude(a => a.Category)
                .Include(m => m.Areas.Where(a => a.IsDeleted != true))
                    .ThenInclude(a => a.Stalls.Where(s => s.IsDeleted != true))
                        .ThenInclude(s => s.Category)
                .Include(m => m.Areas.Where(a => a.IsDeleted != true))
                    .ThenInclude(a => a.Stalls.Where(s => s.IsDeleted != true))
                        .ThenInclude(s => s.Contracts.Where(c => c.Status == "Active" && c.IsDeleted != true))
                            .ThenInclude(c => c.Vendor)
                .FirstOrDefaultAsync(m => m.MarketId == marketId && m.IsDeleted != true);

            if (market == null) return null;

            var marketMapDto = _mapper.Map<MarketMapDto>(market);

            // Sort Areas and Stalls to preserve order
            marketMapDto.Areas = marketMapDto.Areas
                .OrderBy(a => a.AreaId)
                .ToList();

            foreach (var area in marketMapDto.Areas)
            {
                area.Stalls = area.Stalls
                    .OrderBy(s => s.Code)
                    .ToList();
            }

            return marketMapDto;
        }
    }
}
