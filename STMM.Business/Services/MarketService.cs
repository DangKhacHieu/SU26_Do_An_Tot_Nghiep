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
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;
        private readonly AppDbContext _context;

        public MarketService(
            IMarketRepository marketRepository, 
            IUserRepository userRepository,
            IBusinessCategoryRepository categoryRepository,
            INotificationService notificationService,
            IMapper mapper, 
            AppDbContext context)
        {
            _marketRepository = marketRepository;
            _userRepository = userRepository;
            _categoryRepository = categoryRepository;
            _notificationService = notificationService;
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
                var user = await _userRepository.GetByIdAsync(currentUserId);
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
                throw new ForbiddenException("ERR_THE_STAFF_ACCOUNT_IS_NOT_ASSIGNED_TO_A_MARKET");
            }

            return await GetMarketMapAsync(user.MarketId.Value)
                ?? throw new NotFoundException("ERR_MARKET_MAP_NOT_FOUND");
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
            var reqAddressLower = request.Address?.Trim().ToLower() ?? "";
            
            var existingMarkets = await _marketRepository.Query()
                .Where(m => m.IsDeleted != true && m.Status != "Rejected" && m.Status != "Inactive")
                .Select(m => new { m.MarketName, m.Address })
                .ToListAsync();

            var isDuplicateMarket = existingMarkets.Any(m => 
                m.MarketName.Trim().ToLower() == reqNameLower && 
                (m.Address?.Trim().ToLower() ?? "") == reqAddressLower);
                
            if (isDuplicateMarket)
            {
                throw new STMM.Business.Exceptions.BadRequestException("Một chợ với cùng Tên và Địa chỉ này đã tồn tại trên hệ thống.");
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
            
            if (market == null || market.IsDeleted == true) return false;

            // Check if any stall in this market has an active contract
            var hasActiveContracts = await _context.Stalls
                .Include(s => s.Contracts)
                .AnyAsync(s => s.Area.MarketId == marketId && s.IsDeleted != true && s.Contracts.Any(c => c.Status == "Active"));

            if (hasActiveContracts)
            {
                throw new STMM.Business.Exceptions.BadRequestException("ERR_KHONG_THE_XOA_CHO_VI_CO_SAP_DANG_CO_HOP_DONG_H");
            }

            // Soft delete market, areas, and stalls
            market.IsDeleted = true;
            _context.Markets.Update(market);

            foreach (var area in market.Areas)
            {
                area.IsDeleted = true;
                _context.Areas.Update(area);
                foreach (var stall in area.Stalls)
                {
                    stall.IsDeleted = true;
                    _context.Stalls.Update(stall);
                }
            }

            // Detach any user assigned to this market and mark them as deleted/locked
            var usersInMarket = await _context.Users.Where(u => u.MarketId == marketId).ToListAsync();
            foreach (var u in usersInMarket)
            {
                u.MarketId = null;
                u.IsDeleted = true;
                u.DeletedAt = DateTime.UtcNow;
                u.Status = "Locked"; // Prevent login
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

            if (status.Equals("Inactive", StringComparison.OrdinalIgnoreCase))
            {
                var adminUser = await _userRepository.Query()
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Role.Name == "Admin");
                int requestingUserId = adminUser?.UserId ?? market.CreatorId ?? 0;
                await DeactivateMarketAsync(marketId, requestingUserId);
                return true;
            }

            market.Status = status;
            _marketRepository.Update(market);

            if (status.Equals("Active", StringComparison.OrdinalIgnoreCase) || status.Equals("Approved", StringComparison.OrdinalIgnoreCase))
            {
                var creator = await _userRepository.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == market.CreatorId);
                if (creator != null && creator.Role?.Name == "Manager")
                {
                    creator.MarketId = market.MarketId;
                    _userRepository.Update(creator);
                }
            }
            else if (status.Equals("Rejected", StringComparison.OrdinalIgnoreCase))
            {
                var creator = await _userRepository.Query().FirstOrDefaultAsync(u => u.MarketId == marketId);
                if (creator != null)
                {
                    creator.MarketId = null;
                    _userRepository.Update(creator);
                }
            }

            await _marketRepository.SaveChangesAsync();
            return true;
        }

        public async Task<DeactivateMarketResult> DeactivateMarketAsync(int marketId, int requestingUserId, CancellationToken ct = default)
        {
            var market = await _marketRepository.GetMarketWithStallContractsAsync(marketId, ct);
            if (market == null)
                throw new NotFoundException("ERR_KHONG_TIM_THAY_CHO");

            if (market.Status == "Inactive")
                throw new BadRequestException("ERR_CHO_NAY_DA_O_TRANG_THAI_NGUNG_HOAT_DONG_ROI");
            if (market.Status == "Pending")
                throw new BadRequestException("ERR_CHO_DANG_CHO_DUYET_VUI_LONG_HUY_DANG_KY_THAY_VI_NG");

            var requestingUser = await _userRepository.Query()
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.UserId == requestingUserId, ct);

            bool isOwner = market.CreatorId == requestingUserId || (requestingUser != null && requestingUser.MarketId == marketId);
            bool isAdmin = requestingUser?.Role?.Name == "Admin";

            if (!isOwner && !isAdmin)
                throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_NGUNG_HOAT_DONG_CHO_NAY");

            int activeContractCount = market.Areas
                .SelectMany(a => a.Stalls)
                .SelectMany(s => s.Contracts)
                .Count(c => c.Status == "Active" && c.IsDeleted != true);

            if (activeContractCount > 0)
                throw new BadRequestException($"ERR_MARKET_DEACTIVATE_ACTIVE_CONTRACTS_ACTIVECONTRACTC|{activeContractCount}");

            int unpaidInvoiceCount = await _marketRepository.CountUnpaidInvoicesAsync(marketId, ct);
            if (unpaidInvoiceCount > 0)
                throw new BadRequestException($"ERR_MARKET_DEACTIVATE_UNPAID_INVOICES_UNPAIDINVOICECOU|{unpaidInvoiceCount}");

            int activeServiceCount = await _marketRepository.CountActiveServiceRegistrationsAsync(marketId, ct);
            if (activeServiceCount > 0)
                throw new BadRequestException($"ERR_MARKET_DEACTIVATE_ACTIVE_SERVICES_ACTIVESERVICECOU|{activeServiceCount}");

            using var transaction = await _marketRepository.BeginTransactionAsync(ct);
            try
            {
                market.Status = "Inactive";
                _marketRepository.Update(market);

                // Khóa tất cả người dùng (Manager, Staff)
                var usersInMarket = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.MarketId == marketId || (u.UserId == market.CreatorId && u.Role.Name == "Manager"))
                    .ToListAsync(ct);

                // Khóa tất cả Vendors đang có hợp đồng tại chợ
                var vendorsInMarket = await _context.Users
                    .Include(u => u.Role)
                    .Where(u => u.Vendor != null && u.Vendor.Contracts.Any(c => c.Stall.Area.MarketId == marketId))
                    .ToListAsync(ct);

                var allUsersToLock = usersInMarket.Concat(vendorsInMarket).DistinctBy(u => u.UserId).ToList();
                var affectedUserIds = new List<int>();

                foreach (var u in allUsersToLock)
                {
                    affectedUserIds.Add(u.UserId);
                    u.MarketId = null;
                    u.IsDeleted = true;
                    u.DeletedAt = DateTime.UtcNow;
                    u.Status = "Locked"; // Prevent login
                    u.OtpCode = null; // Clear any pending OTPs
                    u.OtpExpiredAt = null;
                    
                    _context.Users.Update(u);
                }

                await _marketRepository.DeactivateAllMetersAsync(marketId, ct);

                int senderUserId = requestingUserId;
                if (senderUserId <= 0)
                {
                    var admin = await _userRepository.Query().FirstOrDefaultAsync(u => u.Role.Name == "Admin", ct);
                    senderUserId = admin?.UserId ?? market.CreatorId ?? 1;
                }

                foreach (var userId in affectedUserIds)
                {
                    try
                    {
                        await _notificationService.CreateAsync(new STMM.Business.DTOs.Notification.CreateNotificationRequest
                        {
                            TargetUserId = userId,
                            Title = "Chợ đã ngưng hoạt động",
                            Content = $"Chợ '{market.MarketName}' đã ngưng hoạt động. Tài khoản của bạn đã được gỡ liên kết khỏi chợ này.",
                            NotiType = "System",
                            CreatedByUserId = senderUserId
                        }, ct);
                    }
                    catch
                    {
                        // Best effort for notifications
                    }
                }

                await _marketRepository.SaveChangesAsync(ct);
                await transaction.CommitAsync(ct);

                return new DeactivateMarketResult
                {
                    MarketId = marketId,
                    MarketName = market.MarketName,
                    AffectedUserCount = affectedUserIds.Count
                };
            }
            catch (Exception)
            {
                await transaction.RollbackAsync(ct);
                throw;
            }
        }
    }
}
