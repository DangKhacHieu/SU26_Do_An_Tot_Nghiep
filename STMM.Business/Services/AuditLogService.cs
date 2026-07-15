using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using STMM.Business.DTOs.AuditLog;
using STMM.Business.DTOs.Common;
using STMM.Business.Interfaces;
using STMM.Business.Hubs;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class AuditLogService : IAuditLogService
    {
        private readonly IAuditLogRepository _auditLogRepository;
        private readonly IUserRepository _userRepository;
        private readonly IHubContext<AuditLogHub> _hubContext;
        private readonly IMapper _mapper;

        public AuditLogService(
            IAuditLogRepository auditLogRepository, 
            IUserRepository userRepository,
            IHubContext<AuditLogHub> hubContext,
            IMapper mapper)
        {
            _auditLogRepository = auditLogRepository ?? throw new ArgumentNullException(nameof(auditLogRepository));
            _userRepository = userRepository ?? throw new ArgumentNullException(nameof(userRepository));
            _hubContext = hubContext ?? throw new ArgumentNullException(nameof(hubContext));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
        }

        public async Task LogAsync(int userId, string action, string? ipAddress, CancellationToken ct = default)
        {
            var log = new AuditLog
            {
                UserId = userId,
                Action = action,
                IpAddress = ipAddress,
                CreatedAt = DateTime.UtcNow
            };

            await _auditLogRepository.AddAsync(log, ct);
            await _auditLogRepository.SaveChangesAsync(ct);

            try
            {
                // Fetch the user with role relation to populate fields for the broadcast DTO
                var user = await _userRepository.Query()
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.UserId == userId, ct);

                if (user != null)
                {
                    log.User = user;
                }

                var dto = _mapper.Map<AuditLogDto>(log);
                await _hubContext.Clients.All.SendAsync("ReceiveAuditLog", dto, ct);
            }
            catch (Exception)
            {
                // Silent catch to prevent logging broadcast failure from breaking core database transaction
            }
        }

        public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogQueryParams queryParams, CancellationToken ct = default)
        {
            var query = _auditLogRepository.Query()
                .Include(a => a.User)
                    .ThenInclude(u => u.Role)
                .AsQueryable();

            // Lọc theo từ khóa tìm kiếm (Tên hoặc Email người dùng)
            if (!string.IsNullOrEmpty(queryParams.Search))
            {
                var search = queryParams.Search.ToLower();
                query = query.Where(a => a.User != null &&
                    ((a.User.Name != null && a.User.Name.ToLower().Contains(search)) ||
                     (a.User.Email != null && a.User.Email.ToLower().Contains(search))));
            }

            // Lọc theo từ khóa hành động
            if (!string.IsNullOrEmpty(queryParams.Action))
            {
                var action = queryParams.Action.ToLower();
                query = query.Where(a => a.Action != null && a.Action.ToLower().Contains(action));
            }

            // Lọc theo ngày bắt đầu
            if (queryParams.StartDate.HasValue)
            {
                var startDate = DateTime.SpecifyKind(queryParams.StartDate.Value, DateTimeKind.Utc);
                query = query.Where(a => a.CreatedAt >= startDate);
            }

            // Lọc theo ngày kết thúc
            if (queryParams.EndDate.HasValue)
            {
                var endDate = DateTime.SpecifyKind(queryParams.EndDate.Value.Date.AddDays(1).AddTicks(-1), DateTimeKind.Utc);
                query = query.Where(a => a.CreatedAt <= endDate);
            }

            // Sắp xếp mới nhất trước
            query = query.OrderByDescending(a => a.CreatedAt);

            var totalCount = await query.CountAsync(ct);

            var items = await query
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .ToListAsync(ct);

            var dtos = _mapper.Map<IEnumerable<AuditLogDto>>(items);

            return new PagedResult<AuditLogDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }
    }
}
