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
                var taskTypes = s.PendingTaskTypes.ToList();
                if (s.HasUnpaidInvoice)
                {
                    // Unpaid invoice represents a CashCollection task
                    taskTypes.Insert(0, "CashCollection");
                }

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
