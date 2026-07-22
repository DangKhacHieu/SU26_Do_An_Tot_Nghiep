using AutoMapper;
using FluentValidation;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Notification;
using STMM.Business.DTOs.Request;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class RequestService : IRequestService
    {
        private readonly IRequestRepository _requestRepository;
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly IUserRepository _userRepository;
        private readonly INotificationService _notificationService;
        private readonly IValidator<ManagerQuotationDecisionRequest> _managerDecisionValidator;
        private readonly IMapper _mapper;
        private readonly ILogger<RequestService> _logger;

        public RequestService(
            IRequestRepository requestRepository,
            IStaffTaskRepository staffTaskRepository,
            IUserRepository userRepository,
            INotificationService notificationService,
            IValidator<ManagerQuotationDecisionRequest> managerDecisionValidator,
            IMapper mapper,
            ILogger<RequestService> logger)
        {
            _requestRepository = requestRepository;
            _staffTaskRepository = staffTaskRepository;
            _userRepository = userRepository;
            _notificationService = notificationService;
            _managerDecisionValidator = managerDecisionValidator;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<PagedResult<RequestDto>> GetRequestsForManagerAsync(RequestQueryParams queryParams, int? managerUserId = null, CancellationToken ct = default)
        {
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    return new PagedResult<RequestDto>
                    {
                        Items = new List<RequestDto>(),
                        TotalCount = 0,
                        PageNumber = queryParams.PageNumber,
                        PageSize = queryParams.PageSize
                    };
                }
            }

            var (items, totalCount) = await _requestRepository.GetRequestsPagedAsync(
                vendorId: null,
                queryParams.StallId,
                queryParams.Status,
                queryParams.RequestType,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager?.MarketId != null)
                {
                    items = items.Where(r => r.Stall?.Area?.MarketId == manager.MarketId.Value || r.Vendor?.User?.MarketId == manager.MarketId.Value).ToList();
                    totalCount = items.Count();
                }
            }

            return new PagedResult<RequestDto>
            {
                Items = _mapper.Map<IEnumerable<RequestDto>>(items),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<RequestDto> GetRequestByIdForManagerAsync(int id, int? managerUserId = null, CancellationToken ct = default)
        {
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    throw new NotFoundException($"Yêu cầu với mã {id} không tìm thấy.");
                }
            }

            var request = await _requestRepository.GetRequestWithRelationsAsync(id, ct);

            if (request == null)
            {
                throw new NotFoundException($"Yêu cầu với mã {id} không tìm thấy.");
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> ResolveViolationAppealAsync(
            int requestId,
            bool approve,
            CancellationToken ct = default)
        {
            var request = await _requestRepository.ApproveOrRejectAppealAsync(requestId, approve, ct)
                ?? throw new NotFoundException(
                    $"Không tìm thấy kháng nghị vi phạm với mã {requestId}.");

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(
                request.RequestId, ct);

            return _mapper.Map<RequestDto>(requestWithRelations!);
        }

        public async Task<RequestDto> ResolveRequestQuotationAsync(
            int requestId,
            int managerUserId,
            ManagerQuotationDecisionRequest decision,
            CancellationToken ct = default)
        {
            await ValidateManagerDecisionAsync(decision, ct);

            var marketId = await GetManagerMarketIdAsync(managerUserId, ct);
            var request = await LoadManagerReviewRequestAsync(requestId, marketId, ct);
            var repairTasks = await _staffTaskRepository.GetRepairTasksForRequestInMarketAsync(
                requestId,
                marketId,
                ct);
            EnsureQuotationCanBeReviewed(request, repairTasks, decision.Action);

            ApplyManagerDecision(request, repairTasks, decision);
            TrackQuotationChanges(request, repairTasks);
            await _requestRepository.SaveChangesAsync(ct);

            await NotifyManagerDecisionAsync(
                request, repairTasks, decision.Action, managerUserId, ct);

            var updatedRequest = await _requestRepository.GetRequestWithRelationsForMarketAsync(
                requestId,
                marketId,
                ct);
            return _mapper.Map<RequestDto>(updatedRequest!);
        }

        private async Task ValidateManagerDecisionAsync(
            ManagerQuotationDecisionRequest decision,
            CancellationToken ct)
        {
            var validationResult = await _managerDecisionValidator.ValidateAsync(decision, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(
                    string.Join("; ", validationResult.Errors.Select(error => error.ErrorMessage)));
            }
        }

        private async Task<Request> LoadManagerReviewRequestAsync(
            int requestId,
            int marketId,
            CancellationToken ct)
        {
            var request = await _requestRepository.GetRequestWithRelationsForMarketAsync(
                    requestId,
                    marketId,
                    ct)
                ?? throw new NotFoundException($"Yêu cầu với mã {requestId} không tìm thấy.");

            if (request.RequestType != "FacilityIssue")
            {
                throw new BadRequestException(
                    "Chỉ yêu cầu sửa chữa FacilityIssue mới có quyết định báo giá.");
            }

            if (request.Status != "PendingManagerReview")
            {
                throw new BadRequestException(
                    "Yêu cầu phải ở trạng thái PendingManagerReview trước khi Manager đưa ra quyết định.");
            }

            return request;
        }

        private static void EnsureQuotationCanBeReviewed(
            Request request,
            IReadOnlyCollection<StaffTask> repairTasks,
            string action)
        {
            if (request.QuotationAmount is null or <= 0 ||
                !repairTasks.Any(task =>
                    task.Status == "PendingApproval" &&
                    task.ActualCost is > 0))
            {
                throw new BadRequestException(
                    "The request does not have a valid repair quotation awaiting review.");
            }

            if (action == ManagerQuotationDecisionRequest.SendToVendor &&
                (request.Vendor == null || request.Vendor.UserId <= 0))
            {
                throw new BadRequestException(
                    "The request does not have a vendor who can confirm the quotation.");
            }
        }

        private async Task<int> GetManagerMarketIdAsync(
            int managerUserId,
            CancellationToken ct)
        {
            var manager = await _userRepository.GetUserByIdWithRoleAsync(managerUserId, ct);
            if (manager?.MarketId == null)
            {
                throw new ForbiddenException("The Manager account is not assigned to a market.");
            }

            return manager.MarketId.Value;
        }

        private static void ApplyManagerDecision(
            Request request,
            IReadOnlyCollection<StaffTask> repairTasks,
            ManagerQuotationDecisionRequest decision)
        {
            request.PayerDecisionNote = decision.DecisionNote?.Trim();
            request.PayerContractClause = decision.ContractClause?.Trim();
            request.UpdatedAt = DateTime.UtcNow;

            switch (decision.Action)
            {
                case ManagerQuotationDecisionRequest.ApproveAsMarket:
                    request.PaidBy = "Market";
                    request.IsQuoteApproved = true;
                    request.Status = "Approved";
                    SetTaskStatus(repairTasks, new[] { "PendingApproval" }, "In_Progress");
                    break;

                case ManagerQuotationDecisionRequest.SendToVendor:
                    request.PaidBy = "Vendor";
                    request.IsQuoteApproved = null;
                    request.VendorRejectReason = null;
                    request.Status = "Quoted";
                    break;

                case ManagerQuotationDecisionRequest.ReturnForRevision:
                    request.PaidBy = null;
                    request.IsQuoteApproved = null;
                    request.Status = "Pending";
                    SetTaskStatus(repairTasks, new[] { "PendingApproval" }, "Pending");
                    break;

                case ManagerQuotationDecisionRequest.Reject:
                    request.IsQuoteApproved = false;
                    request.Status = "Rejected";
                    SetTaskStatus(
                        repairTasks,
                        new[] { "PendingApproval", "Pending" },
                        "Cancelled");
                    break;
            }
        }

        private static void SetTaskStatus(
            IEnumerable<StaffTask> tasks,
            IReadOnlyCollection<string> currentStatuses,
            string targetStatus)
        {
            foreach (var task in tasks.Where(task => currentStatuses.Contains(task.Status)))
            {
                task.Status = targetStatus;
            }
        }

        private void TrackQuotationChanges(
            Request request,
            IEnumerable<StaffTask> repairTasks)
        {
            _requestRepository.Update(request);

            foreach (var task in repairTasks)
            {
                _staffTaskRepository.Update(task);
            }
        }

        private async Task NotifyManagerDecisionAsync(
            Request request,
            IReadOnlyCollection<StaffTask> repairTasks,
            string action,
            int managerUserId,
            CancellationToken ct)
        {
            if (action == ManagerQuotationDecisionRequest.SendToVendor)
            {
                await TrySendNotificationAsync(new CreateNotificationRequest
                {
                    Title = "Báo giá sửa chữa cần xác nhận",
                    Content = $"Yêu cầu REQ-{request.RequestId} có báo giá cần bạn xác nhận.",
                    NotiType = "Request",
                    CreatedByUserId = managerUserId,
                    TargetUserId = request.Vendor.UserId
                }, ct);
            }

            if (action is ManagerQuotationDecisionRequest.ApproveAsMarket
                or ManagerQuotationDecisionRequest.ReturnForRevision
                or ManagerQuotationDecisionRequest.Reject)
            {
                foreach (var staffUserId in repairTasks
                    .Select(task => task.AssignedToUserId)
                    .Distinct())
                {
                    await TrySendNotificationAsync(new CreateNotificationRequest
                    {
                        Title = GetStaffNotificationTitle(action),
                        Content = GetStaffNotificationContent(request, action),
                        NotiType = "Request",
                        CreatedByUserId = managerUserId,
                        TargetUserId = staffUserId
                    }, ct);
                }
            }
        }

        private async Task TrySendNotificationAsync(
            CreateNotificationRequest notification,
            CancellationToken ct)
        {
            try
            {
                await _notificationService.CreateAsync(notification, ct);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(
                    ex,
                    "Could not send quotation notification to user {UserId}.",
                    notification.TargetUserId);
            }
        }

        private static string GetStaffNotificationTitle(string action)
        {
            return action switch
            {
                ManagerQuotationDecisionRequest.ApproveAsMarket => "Báo giá đã được duyệt",
                ManagerQuotationDecisionRequest.ReturnForRevision => "Báo giá cần chỉnh sửa",
                ManagerQuotationDecisionRequest.Reject => "Yêu cầu sửa chữa bị từ chối",
                _ => "Cập nhật báo giá sửa chữa"
            };
        }

        private static string GetStaffNotificationContent(Request request, string action)
        {
            var note = string.IsNullOrWhiteSpace(request.PayerDecisionNote)
                ? string.Empty
                : $" Ghi chú: {request.PayerDecisionNote}";

            return action switch
            {
                ManagerQuotationDecisionRequest.ApproveAsMarket =>
                    $"Báo giá của REQ-{request.RequestId} đã được duyệt. Task có thể bắt đầu thi công.",
                ManagerQuotationDecisionRequest.ReturnForRevision =>
                    $"Báo giá của REQ-{request.RequestId} được trả lại để chỉnh sửa.{note}",
                ManagerQuotationDecisionRequest.Reject =>
                    $"Yêu cầu REQ-{request.RequestId} đã bị từ chối.{note}",
                _ => $"Yêu cầu REQ-{request.RequestId} đã được cập nhật."
            };
        }
    }
}
