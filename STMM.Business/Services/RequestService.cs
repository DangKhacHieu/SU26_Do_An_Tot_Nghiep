using AutoMapper;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Request;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class RequestService : IRequestService
    {
        private readonly IRequestRepository _requestRepository;
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly INotificationService _notificationService;
        private readonly IMapper _mapper;

        public RequestService(
            IRequestRepository requestRepository, 
            IStaffTaskRepository staffTaskRepository, 
            INotificationService notificationService,
            IMapper mapper)
        {
            _requestRepository = requestRepository;
            _staffTaskRepository = staffTaskRepository;
            _notificationService = notificationService;
            _mapper = mapper;
        }

        public async Task<PagedResult<RequestDto>> GetRequestsForManagerAsync(RequestQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _requestRepository.GetRequestsPagedAsync(
                null, // vendorId
                queryParams.StallId, // stallId
                queryParams.Status,
                queryParams.RequestType,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            var dtos = _mapper.Map<IEnumerable<RequestDto>>(items);

            return new PagedResult<RequestDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<RequestDto> GetRequestByIdForManagerAsync(int id, CancellationToken ct = default)
        {
            var request = await _requestRepository.GetRequestWithRelationsAsync(id, ct);

            if (request == null)
            {
                throw new NotFoundException($"Yêu cầu với mã {id} không tìm thấy.");
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> ResolveViolationAppealAsync(int requestId, bool approve, CancellationToken ct = default)
        {
            var request = await _requestRepository.ApproveOrRejectAppealAsync(requestId, approve, ct);

            if (request == null)
            {
                throw new NotFoundException($"Violation appeal request with ID {requestId} was not found or is not a ViolationAppeal.");
            }

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(requestId, ct);
            return _mapper.Map<RequestDto>(requestWithRelations!);
        }

        public async Task<RequestDto> ResolveRequestQuoteAsync(int requestId, bool approve, CancellationToken ct = default)
        {
            var request = await _requestRepository.GetByIdAsync(requestId, ct);
            if (request == null)
            {
                throw new NotFoundException($"Yêu cầu với mã {requestId} không tìm thấy.");
            }

            if (request.Status != "Quoted")
            {
                throw new BadRequestException("Chỉ có thể duyệt/từ chối yêu cầu đang ở trạng thái 'Quoted'.");
            }

            if (request.PaidBy != "Market")
            {
                throw new BadRequestException(
                    "Manager chỉ có thể duyệt/từ chối báo giá khi BQL chịu phí (PaidBy = Market). " +
                    "Nếu Tiểu thương chịu phí, Tiểu thương phải tự duyệt trên portal của họ.");
            }

            request.IsQuoteApproved = approve;
            request.Status = approve ? "Approved" : "Pending";
            request.UpdatedAt = DateTime.UtcNow;

            // Synchronize linked staff task status
            var tasks = await _staffTaskRepository.FindAsync(t => t.RequestId == requestId, ct);
            foreach (var task in tasks)
            {
                if (approve)
                {
                    if (task.Status == "PendingApproval")
                    {
                        task.Status = "In_Progress";
                        _staffTaskRepository.Update(task);
                    }
                }
                else
                {
                    if (task.Status == "PendingApproval" || task.Status == "Pending" || task.Status == "In_Progress")
                    {
                        task.Status = "Pending";
                        _staffTaskRepository.Update(task);

                        await _notificationService.CreateAsync(new CreateNotificationRequest
                        {
                            Title = "Quotation Rejected",
                            Content = $"Quotation for task \"{task.Title}\" has been rejected. Please update materials and resubmit.",
                            NotiType = "System",
                            CreatedByUserId = task.AssignedToUserId,
                            TargetUserId = task.AssignedToUserId
                        }, ct);
                    }
                }
            }
            await _staffTaskRepository.SaveChangesAsync(ct);

            _requestRepository.Update(request);
            await _requestRepository.SaveChangesAsync(ct);

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(requestId, ct);
            return _mapper.Map<RequestDto>(requestWithRelations!);
        }
    }
}
