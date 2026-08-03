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
        public async Task<IReadOnlyList<StallTaskSummaryDto>> GetStallTasksAsync(
            int staffUserId,
            CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(staffUserId, ct);
            var stalls = await _stallRepository.GetStallTasksAsync(
                staffUserId,
                marketId,
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

            return items;
        }

        public async Task<IEnumerable<StaffStallLookupDto>> GetStallLookupAsync(
            int staffUserId,
            string? search,
            CancellationToken ct = default)
        {
            var marketId = await GetStaffMarketIdAsync(staffUserId, ct);
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var stalls = await _stallRepository.GetStaffStallLookupAsync(marketId, search, 100, effectiveDate, ct);

            return stalls.Select(s => new StaffStallLookupDto
            {
                StallId = s.StallId,
                StallCode = s.StallCode,
                AreaName = s.AreaName,
                VendorName = s.VendorName,
                StallStatus = s.StallStatus
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
