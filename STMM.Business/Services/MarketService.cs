using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Market;
using STMM.Business.Interfaces;
using STMM.Business.Exceptions;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Entities;
using STMM.DataAccess.Data;

namespace STMM.Business.Services
{
    public class MarketService : IMarketService
    {
        private readonly IMarketRepository _marketRepository;
        private readonly IUserRepository _userRepository;
        private readonly IBusinessCategoryRepository _categoryRepository;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public MarketService(
            IMarketRepository marketRepository, 
            IUserRepository userRepository,
            IBusinessCategoryRepository categoryRepository,
            IMapper mapper, 
            AppDbContext context)
        {
            _marketRepository = marketRepository;
            _userRepository = userRepository;
            _categoryRepository = categoryRepository;
            _mapper = mapper;
            _context = context;
        }

        public async Task<IEnumerable<MarketDto>> GetAllMarketsAsync(int currentUserId, string currentUserRole)
        {
            if (currentUserId < 0)
            {
                throw new STMM.Business.Exceptions.BadRequestException("ID người dùng không hợp lệ.");
            }

            var query = _marketRepository.Query()
                .Include(m => m.Areas)
                    .ThenInclude(a => a.Stalls)
                .Where(m => m.IsDeleted != true);

            if (currentUserRole == "Manager")
            {
                var user = await _context.Users.FindAsync(currentUserId);
                if (user != null)
                {
                    query = query.Where(m => m.CreatorId == currentUserId || (user.MarketId.HasValue && m.MarketId == user.MarketId.Value));
                }
                else
                {
                    // Manager has not created/assigned a market yet
                    return new List<MarketDto>();
                }
            }

            var markets = await query.OrderBy(m => m.MarketId).ToListAsync();

            return _mapper.Map<IEnumerable<MarketDto>>(markets);
        }

        public async Task<MarketMapDto?> GetMarketMapAsync(int marketId)
        {
            var market = await _marketRepository.GetMarketMapAsync(marketId);

            if (market == null) return null;

            var marketMapDto = _mapper.Map<MarketMapDto>(market);

            // Sort Areas and Stalls to preserve order
            marketMapDto.Areas = marketMapDto.Areas
                .OrderBy(a => a.AreaId)
                .ToList();

            foreach (var area in marketMapDto.Areas)
            {
                if (area.Stalls != null)
                {
                    area.Stalls = area.Stalls
                        .OrderBy(s => s.Code)
                        .ToList();
                }
            }

            return marketMapDto;
        }

        public async Task<MarketMapDto> GetMarketMapForStaffAsync(int staffUserId)
        {
            var user = await _userRepository.GetByIdAsync(staffUserId);

            if (user == null || !user.MarketId.HasValue)
            {
                throw new ForbiddenException("The staff account is not assigned to a market.");
            }

            return await GetMarketMapAsync(user.MarketId.Value)
                ?? throw new NotFoundException("Market map not found.");
        }

        public async Task<MarketDto> CreateMarketBulkAsync(CreateMarketBulkRequest request, int currentUserId)
        {
            if (string.IsNullOrWhiteSpace(request.MarketName))
                throw new STMM.Business.Exceptions.BadRequestException("Tên chợ không được để trống.");
                
            if (request.Areas == null || !request.Areas.Any())
                throw new STMM.Business.Exceptions.BadRequestException("Chợ phải có ít nhất một khu vực.");

            // 1. Validation
            var user = await _userRepository.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId);
            if (user != null && string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase))
            {
                var existingMarket = await _marketRepository.Query()
                    .FirstOrDefaultAsync(m => (m.CreatorId == currentUserId || (user.MarketId.HasValue && m.MarketId == user.MarketId.Value)) 
                                           && m.IsDeleted != true 
                                           && m.Status != "Rejected" 
                                           && m.Status != "Inactive");
                if (existingMarket != null)
                {
                    if (existingMarket.Status == "Pending")
                    {
                        throw new STMM.Business.Exceptions.BadRequestException("Bạn đã gửi yêu cầu đăng ký chợ đang chờ Admin duyệt. Vui lòng chờ Admin phê duyệt hoặc từ chối trước khi đăng ký chợ mới.");
                    }
                    else
                    {
                        throw new STMM.Business.Exceptions.BadRequestException("Bạn đã sở hữu một chợ đang hoạt động trên hệ thống. Mỗi quản lý chỉ được phép tạo và quản lý duy nhất 1 chợ.");
                    }
                }
            }

            var reqNameLower = request.MarketName.Trim().ToLower();
            var isMarketNameExist = await _marketRepository.Query().AnyAsync(m => m.MarketName.ToLower() == reqNameLower && m.IsDeleted != true && m.Status != "Rejected" && m.Status != "Inactive");
            if (isMarketNameExist)
            {
                throw new STMM.Business.Exceptions.BadRequestException("Tên chợ đã tồn tại trên hệ thống (chợ đang hoạt động hoặc chờ duyệt).");
            }

            // Check duplicate stall names within the new market
            var allStallCodes = request.Areas.Where(a => a.Stalls != null).SelectMany(a => a.Stalls).Select(s => s.Code).Where(c => !string.IsNullOrWhiteSpace(c)).ToList();
            if (allStallCodes.Count != allStallCodes.Distinct().Count())
            {
                throw new STMM.Business.Exceptions.BadRequestException("Tên sạp không được trùng lặp bên trong cùng một chợ.");
            }

            // Get a default CategoryId to avoid Foreign Key constraints
            var firstCategory = await _categoryRepository.Query().FirstOrDefaultAsync();
            int defaultCategoryId = firstCategory?.CategoryId ?? 1;

            // 2. Map and Save using EF Core Graph Insertion and Transaction
            using var transaction = await _marketRepository.BeginTransactionAsync();
            try
            {
                var newMarket = new Market
                {
                    MarketName = request.MarketName.Trim(),
                    Address = request.Address,
                    Size = request.Size,
                    SvgPath = request.SvgPath,
                    MinX = request.MinX,
                    MinY = request.MinY,
                    MaxX = request.MaxX,
                    MaxY = request.MaxY,
                    Status = "Pending",
                    CreatorId = currentUserId,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false,
                    Areas = new List<Area>()
                };

                foreach (var areaReq in request.Areas)
                {
                    var newArea = new Area
                    {
                        Name = areaReq.Name,
                        Description = areaReq.Description,
                        CategoryId = areaReq.CategoryId > 0 ? areaReq.CategoryId : null,
                        Size = areaReq.Size,
                        SvgPath = areaReq.SvgPath,
                        MinX = areaReq.MinX,
                        MinY = areaReq.MinY,
                        MaxX = areaReq.MaxX,
                        MaxY = areaReq.MaxY,
                        CreatedAt = DateTime.UtcNow,
                        IsDeleted = false,
                        Stalls = new List<Stall>()
                    };

                    if (areaReq.Stalls != null)
                    {
                        // HIDDEN: Stall generation is temporarily disabled in the Grid Area Subdivision phase.
                        // foreach (var stallReq in areaReq.Stalls)
                        // {
                        //     var newStall = new Stall
                        //     {
                        //         Code = stallReq.Code,
                        //         CategoryId = stallReq.CategoryId > 0 ? stallReq.CategoryId : defaultCategoryId,
                        //         Status = stallReq.Status ?? "Available",
                        //         Size = stallReq.Size,
                        //         MapX = stallReq.MapX,
                        //         MapY = stallReq.MapY,
                        //         Width = stallReq.Width,
                        //         Height = stallReq.Height,
                        //         Rotation = stallReq.Rotation,
                        //         SvgPath = stallReq.SvgPath,
                        //         CreatedAt = DateTime.UtcNow,
                        //         IsDeleted = false
                        //     };
                        //     newArea.Stalls.Add(newStall);
                        // }
                    }
                    newMarket.Areas.Add(newArea);
                }

                await _marketRepository.AddAsync(newMarket);
                await _marketRepository.SaveChangesAsync();
                await transaction.CommitAsync();

                return _mapper.Map<MarketDto>(newMarket);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                var msg = ex.InnerException != null ? $"{ex.Message} -> {ex.InnerException.Message}" : ex.Message;
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

            // Detach any user assigned to this market
            var usersInMarket = await _context.Users.Where(u => u.MarketId == marketId).ToListAsync();
            foreach (var u in usersInMarket)
            {
                u.MarketId = null;
                _context.Users.Update(u);
            }

            await _context.SaveChangesAsync();
            
            return true;
        }

        public async Task<bool> ChangeMarketStatusAsync(int marketId, string status)
        {
            if (marketId <= 0)
            {
                throw new STMM.Business.Exceptions.BadRequestException("ID chợ không hợp lệ.");
            }

            var allowedStatuses = new[] { "Active", "Rejected", "Inactive", "Pending" };
            if (!allowedStatuses.Contains(status))
            {
                throw new STMM.Business.Exceptions.BadRequestException("Trạng thái không hợp lệ.");
            }

            var market = await _marketRepository.GetByIdAsync(marketId);
            if (market == null) return false;

            market.Status = status;
            _context.Markets.Update(market);

            if (status.Equals("Active", StringComparison.OrdinalIgnoreCase) || status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                var creator = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == market.CreatorId);
                if (creator != null && creator.Role?.Name == "Manager")
                {
                    creator.MarketId = market.MarketId;
                    _context.Users.Update(creator);
                }
            }
            else if (status.Equals("Rejected", StringComparison.OrdinalIgnoreCase) || status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                var creator = await _context.Users.FirstOrDefaultAsync(u => u.MarketId == marketId);
                if (creator != null)
                {
                    creator.MarketId = null;
                    _context.Users.Update(creator);
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeactivateMarketAsync(int marketId, int managerId)
        {
            var market = await _context.Markets
                .Include(m => m.Areas)
                    .ThenInclude(a => a.Stalls)
                        .ThenInclude(s => s.Contracts)
                .FirstOrDefaultAsync(m => m.MarketId == marketId);
                
            if (market == null) throw new Exception("Market not found.");

            // Check if there are any active contracts
            bool hasActiveContracts = market.Areas
                .SelectMany(a => a.Stalls)
                .SelectMany(s => s.Contracts)
                .Any(c => c.Status == "Active" && c.IsDeleted != true);

            if (hasActiveContracts)
            {
                throw new Exception("Không thể ngưng hoạt động chợ vì vẫn còn hợp đồng đang hoạt động.");
            }

            market.Status = "Inactive";
            _context.Markets.Update(market);

            // Detach manager from this market
            var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == managerId);
            if (user != null && user.MarketId == marketId)
            {
                user.MarketId = null;
                _context.Users.Update(user);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
