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
using STMM.DataAccess.Data;

namespace STMM.Business.Services
{
    public class MarketService : IMarketService
    {
        private readonly IMarketRepository _marketRepository;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public MarketService(IMarketRepository marketRepository, IMapper mapper, AppDbContext context)
        {
            _marketRepository = marketRepository;
            _mapper = mapper;
            _context = context;
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

        public async Task<MarketDto> CreateMarketBulkAsync(CreateMarketBulkRequest request)
        {
            // 1. Validation
            var isMarketNameExist = await _context.Markets.AnyAsync(m => m.MarketName == request.MarketName && m.IsDeleted != true);
            if (isMarketNameExist)
            {
                throw new Exception("Tên chợ đã tồn tại trên hệ thống.");
            }

            // Check duplicate stall names within the new market
            var allStallCodes = request.Areas.SelectMany(a => a.Stalls).Select(s => s.Code).ToList();
            if (allStallCodes.Count != allStallCodes.Distinct().Count())
            {
                throw new Exception("Tên sạp không được trùng lặp bên trong cùng một chợ.");
            }

            // Get a default CategoryId to avoid Foreign Key constraints
            var firstCategory = await _context.BusinessCategories.FirstOrDefaultAsync();
            int defaultCategoryId = firstCategory?.CategoryId ?? 1;

            // 2. Map and Save
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var newMarket = new Market
                {
                    MarketName = request.MarketName,
                    Address = request.Address,
                    Size = request.Size,
                    SvgPath = request.SvgPath,
                    MinX = request.MinX,
                    MinY = request.MinY,
                    MaxX = request.MaxX,
                    MaxY = request.MaxY,
                    Status = "Pending",
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };

                _context.Markets.Add(newMarket);
                await _context.SaveChangesAsync();

                foreach (var areaReq in request.Areas)
                {
                        var newArea = new Area
                    {
                        MarketId = newMarket.MarketId,
                        Name = areaReq.Name,
                        Description = areaReq.Description,
                        CategoryId = areaReq.CategoryId > 0 ? areaReq.CategoryId : defaultCategoryId,
                        Size = areaReq.Size,
                        SvgPath = areaReq.SvgPath,
                        MinX = areaReq.MinX,
                        MinY = areaReq.MinY,
                        MaxX = areaReq.MaxX,
                        MaxY = areaReq.MaxY,
                        CreatedAt = DateTime.UtcNow,
                        IsDeleted = false
                    };
                    _context.Areas.Add(newArea);
                    await _context.SaveChangesAsync();

                    foreach (var stallReq in areaReq.Stalls)
                    {
                        var newStall = new Stall
                        {
                            Code = stallReq.Code,
                            AreaId = newArea.AreaId,
                            CategoryId = stallReq.CategoryId > 0 ? stallReq.CategoryId : defaultCategoryId,
                            Status = stallReq.Status ?? "Available",
                            Size = stallReq.Size,
                            MapX = stallReq.MapX,
                            MapY = stallReq.MapY,
                            Width = stallReq.Width,
                            Height = stallReq.Height,
                            Rotation = stallReq.Rotation,
                            SvgPath = stallReq.SvgPath,
                            CreatedAt = DateTime.UtcNow,
                            IsDeleted = false
                        };
                        _context.Stalls.Add(newStall);
                    }
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return _mapper.Map<MarketDto>(newMarket);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var msg = ex.Message;
                if (ex.InnerException != null) msg += " Inner: " + ex.InnerException.Message;
                throw new Exception($"Lỗi khi tạo chợ: {msg}");
            }
        }

        public async Task<bool> DeleteMarketAsync(int marketId)
        {
            var market = await _context.Markets
                .Include(m => m.Areas)
                .ThenInclude(a => a.Stalls)
                .FirstOrDefaultAsync(m => m.MarketId == marketId);
            
            if (market == null) return false;

            // Hard delete for cleanup purposes
            foreach (var area in market.Areas)
            {
                _context.Stalls.RemoveRange(area.Stalls);
            }
            _context.Areas.RemoveRange(market.Areas);
            _context.Markets.Remove(market);

            await _context.SaveChangesAsync();
            
            return true;
        }
    }
}
