using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.StallTask;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class StallTaskService : IStallTaskService
    {
        private readonly IStallRepository _stallRepository;
        private readonly IUserRepository _userRepository;

        public StallTaskService(
            IStallRepository stallRepository,
            IUserRepository userRepository)
        {
            _stallRepository = stallRepository;
            _userRepository = userRepository;
        }

        /// <inheritdoc />
        public async Task<PagedResult<StallTaskSummaryDto>> GetStallTasksAsync(
            int staffUserId, StallTaskQueryParams queryParams, CancellationToken ct = default)
        {
            ValidateQueryParams(queryParams);

            var filter = string.IsNullOrWhiteSpace(queryParams.Filter)
                ? "All"
                : queryParams.Filter.Trim();
            var search = queryParams.Search?.Trim();

            var marketId = await GetStaffMarketIdAsync(staffUserId, ct);
            var (stalls, totalCount) = await _stallRepository.GetStallTasksPagedAsync(
                staffUserId,
                marketId,
                search,
                filter,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            var items = stalls.Select(s =>
            {
                return new StallTaskSummaryDto
                {
                    StallId = s.StallId,
                    StallCode = s.StallCode,
                    StallCategory = s.StallCategory,
                    StallStatus = s.StallStatus,
                    VendorName = s.VendorName,
                    VendorPhone = s.VendorPhone,
                    HasUnpaidInvoice = s.HasUnpaidInvoice,
                    UnpaidInvoiceCount = s.UnpaidInvoiceCount,
                    UnpaidTotalAmount = s.UnpaidTotalAmount,
                    PendingTaskCount = s.PendingTaskCount,
                    TaskTypes = s.PendingTaskTypes.ToList()
                };
            }).ToList();

            return new PagedResult<StallTaskSummaryDto>
            {
                Items = items,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        private static void ValidateQueryParams(StallTaskQueryParams queryParams)
        {
            if (queryParams.PageNumber < 1)
            {
                throw new BadRequestException("PageNumber must be at least 1.");
            }

            if (queryParams.PageSize is < 1 or > 100)
            {
                throw new BadRequestException("PageSize must be between 1 and 100.");
            }

            var filter = string.IsNullOrWhiteSpace(queryParams.Filter)
                ? "All"
                : queryParams.Filter.Trim();
            var allowedFilters = new[] { "All", "HasUnpaidInvoice", "HasTask" };
            if (!allowedFilters.Contains(filter, StringComparer.Ordinal))
            {
                throw new BadRequestException("Filter must be All, HasUnpaidInvoice, or HasTask.");
            }

            if (queryParams.Search?.Trim().Length > 100)
            {
                throw new BadRequestException("Search must not exceed 100 characters.");
            }
        }

        public async Task<IEnumerable<StaffStallLookupDto>> GetStallLookupAsync(
            int staffUserId,
            string? search,
            CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(staffUserId, ct);
            var stalls = await _stallRepository.GetStaffStallLookupAsync(marketId, search, 100, ct);

            return stalls.Select(s => new StaffStallLookupDto
            {
                StallId = s.StallId,
                StallCode = s.StallCode,
                AreaName = s.AreaName
            });
        }

        private async Task<int> GetStaffMarketIdAsync(int staffUserId, CancellationToken ct)
        {
            var staff = await _userRepository.GetUserByIdWithRoleAsync(staffUserId, ct);
            if (staff?.MarketId == null)
            {
                throw new ForbiddenException("The staff account is not assigned to a market.");
            }

            return staff.MarketId.Value;
        }
    }
}
