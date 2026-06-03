using AutoMapper;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.StallTask;
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
        private readonly IMapper _mapper;

        public StallTaskService(IStallRepository stallRepository, IMapper mapper)
        {
            _stallRepository = stallRepository;
            _mapper = mapper;
        }

        /// <inheritdoc />
        public async Task<PagedResult<StallTaskSummaryDto>> GetStallTasksAsync(
            int staffUserId, StallTaskQueryParams queryParams, CancellationToken ct = default)
        {
            var (stalls, totalCount) = await _stallRepository.GetStallTasksPagedAsync(
                staffUserId,
                queryParams.Search,
                queryParams.Filter,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            // Map to DTOs
            var items = stalls.Select(s =>
            {
                // Active Contract
                var activeContract = s.Contracts.FirstOrDefault(c => c.Status == "Active" && c.IsDeleted != true);
                var vendor = activeContract?.Vendor;
                var vendorUser = vendor?.User;

                // Invoices from active contract
                var unpaidInvoices = activeContract?.Invoices
                    .Where(i => i.Status == "Unpaid" && i.IsDeleted != true)
                    .ToList() ?? new List<Invoice>();

                var hasUnpaid = unpaidInvoices.Any();
                var unpaidCount = unpaidInvoices.Count;
                var unpaidAmount = unpaidInvoices.Sum(i => i.TotalAmount);

                // Pending tasks assigned to this staff user
                var pendingTasksFromIssues = s.Issues
                    .SelectMany(i => i.StaffTasks)
                    .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed");

                var pendingTasksFromRequests = s.Requests
                    .SelectMany(r => r.StaffTasks)
                    .Where(t => t.AssignedToUserId == staffUserId && t.Status != "Completed");

                var allPendingTasks = pendingTasksFromIssues.Concat(pendingTasksFromRequests).ToList();
                var pendingTaskCount = allPendingTasks.Count;

                // Task types collection
                var taskTypes = allPendingTasks.Select(t => t.TaskType).Distinct().ToList();
                if (hasUnpaid)
                {
                    // Unpaid invoice represents a CashCollection task
                    taskTypes.Insert(0, "CashCollection");
                }

                return new StallTaskSummaryDto
                {
                    StallId = s.StallId,
                    StallCode = s.Code,
                    StallCategory = s.Category?.Name ?? string.Empty,
                    StallStatus = s.Status ?? string.Empty,
                    VendorName = vendor?.BusinessName ?? string.Empty,
                    VendorPhone = vendorUser?.Phone ?? string.Empty,
                    HasUnpaidInvoice = hasUnpaid,
                    UnpaidInvoiceCount = unpaidCount,
                    UnpaidTotalAmount = unpaidAmount,
                    PendingTaskCount = pendingTaskCount,
                    TaskTypes = taskTypes
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
    }
}
