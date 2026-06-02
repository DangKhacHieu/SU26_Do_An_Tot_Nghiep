using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.StallTask;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.UnitOfWork;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class StallTaskService : BaseService, IStallTaskService
    {
        public StallTaskService(IUnitOfWork unitOfWork, IMapper mapper)
            : base(unitOfWork, mapper)
        {
        }

        /// <inheritdoc />
        public async Task<PagedResult<StallTaskSummaryDto>> GetStallTasksAsync(
            int staffUserId, StallTaskQueryParams queryParams, CancellationToken ct = default)
        {
            // Query base stalls
            var query = _unitOfWork.Repository<Stall>().Query();

            // Filter out soft deleted stalls
            query = query.Where(s => s.IsDeleted != true);

            // Filter by search (Stall Code)
            if (!string.IsNullOrWhiteSpace(queryParams.Search))
            {
                var search = queryParams.Search.Trim().ToUpper();
                query = query.Where(s => s.Code.ToUpper().Contains(search));
            }

            // Apply filter based on queryParams.Filter
            if (queryParams.Filter == "HasUnpaidInvoice")
            {
                query = query.Where(s => s.Contracts.Any(c => c.IsDeleted != true && c.Status == "Active" &&
                                                             c.Invoices.Any(i => i.IsDeleted != true && i.Status == "Unpaid")));
            }
            else if (queryParams.Filter == "HasTask")
            {
                query = query.Where(s => s.Issues.Any(i => i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")) ||
                                     s.Requests.Any(r => r.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")));
            }
            else
            {
                // "All" - union of both
                query = query.Where(s =>
                    s.Contracts.Any(c => c.IsDeleted != true && c.Status == "Active" &&
                                         c.Invoices.Any(i => i.IsDeleted != true && i.Status == "Unpaid")) ||
                    s.Issues.Any(i => i.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed")) ||
                    s.Requests.Any(r => r.StaffTasks.Any(t => t.AssignedToUserId == staffUserId && t.Status != "Completed"))
                );
            }

            var totalCount = await query.CountAsync(ct);

            // Fetch the page items with necessary relationships
            var stalls = await query
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Vendor)
                        .ThenInclude(v => v.User)
                .Include(s => s.Contracts)
                    .ThenInclude(c => c.Invoices)
                .Include(s => s.Issues)
                    .ThenInclude(i => i.StaffTasks)
                .Include(s => s.Requests)
                    .ThenInclude(r => r.StaffTasks)
                .Include(s => s.Category)
                .OrderBy(s => s.Code)
                .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
                .Take(queryParams.PageSize)
                .AsNoTracking()
                .ToListAsync(ct);

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
