using AutoMapper;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Request;
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
    public class VendorRequestService : IVendorRequestService
    {
        private readonly IRequestRepository _requestRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IViolationRepository _violationRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IStaffTaskRepository _staffTaskRepository;
        private readonly IMapper _mapper;

        public VendorRequestService(
            IRequestRepository requestRepository, 
            IContractRepository contractRepository, 
            IViolationRepository violationRepository, 
            IInvoiceRepository invoiceRepository,
            IStaffTaskRepository staffTaskRepository,
            IMapper mapper)
        {
            _requestRepository = requestRepository;
            _contractRepository = contractRepository;
            _violationRepository = violationRepository;
            _invoiceRepository = invoiceRepository;
            _staffTaskRepository = staffTaskRepository;
            _mapper = mapper;
        }

        public async Task<PagedResult<RequestDto>> GetMyRequestsAsync(int vendorId, RequestQueryParams queryParams)
        {
            if (queryParams.PageNumber < 1)
                throw new BadRequestException("Số trang không hợp lệ.");
            
            if (queryParams.PageSize <= 0 || queryParams.PageSize > 100)
                throw new BadRequestException("Kích thước trang phải từ 1 đến 100.");

            if (!string.IsNullOrWhiteSpace(queryParams.RequestType))
            {
                var validTypes = new[] { "FacilityIssue", "ViolationAppeal", "InvoiceDispute" };
                if (!validTypes.Contains(queryParams.RequestType.Trim()))
                    throw new BadRequestException("Loại yêu cầu không hợp lệ.");
            }

            if (!string.IsNullOrWhiteSpace(queryParams.Status))
            {
                var validStatuses = new[] { "Pending", "Quoted", "Approved", "Rejected", "Cancelled", "In_Progress" };
                if (!validStatuses.Contains(queryParams.Status.Trim()))
                    throw new BadRequestException("Trạng thái yêu cầu không hợp lệ.");
            }

            var (items, totalCount) = await _requestRepository.GetRequestsPagedAsync(
                vendorId,
                queryParams.StallId,
                queryParams.Status?.Trim(),
                queryParams.RequestType?.Trim(),
                queryParams.SearchTerm?.Trim(),
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize);

            var dtos = _mapper.Map<IEnumerable<RequestDto>>(items);

            return new PagedResult<RequestDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<RequestDto> GetRequestDetailAsync(int vendorId, int requestId)
        {
            if (requestId <= 0)
                throw new BadRequestException("ID yêu cầu không hợp lệ.");

            var request = await _requestRepository.GetRequestWithRelationsAsync(requestId);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException("Không tìm thấy yêu cầu hoặc bạn không có quyền xem.");
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> CreateRequestAsync(int vendorId, CreateRequestDto dto)
        {
            if (dto.StallId <= 0)
                throw new BadRequestException("Vui lòng chọn sạp (StallId) hợp lệ.");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new BadRequestException("Tiêu đề không được để trống.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                throw new BadRequestException("Mô tả không được để trống.");

            var validTypes = new[] { "FacilityIssue", "ViolationAppeal", "InvoiceDispute" };
            if (!validTypes.Contains(dto.RequestType))
                throw new BadRequestException("Loại yêu cầu không hợp lệ.");

            if (dto.RequestType == "ViolationAppeal")
            {
                if (!dto.ViolationId.HasValue)
                    throw new BadRequestException("Vui lòng cung cấp ID biên bản vi phạm cần kháng nghị.");
            }
            else
            {
                if (dto.ViolationId.HasValue)
                    throw new BadRequestException("Loại yêu cầu này không được phép đính kèm biên bản vi phạm.");
            }

            if (dto.RequestType == "InvoiceDispute")
            {
                if (!dto.InvoiceId.HasValue)
                    throw new BadRequestException("Vui lòng cung cấp ID hóa đơn cần khiếu nại.");
                
                var invoice = await _invoiceRepository.GetByIdAsync(dto.InvoiceId.Value);
                if (invoice == null)
                    throw new BadRequestException("Không tìm thấy hóa đơn cần khiếu nại.");
            }
            else
            {
                if (dto.InvoiceId.HasValue)
                    throw new BadRequestException("Loại yêu cầu này không được phép đính kèm hóa đơn.");
            }

            // Verify if vendor has a contract for this stall
            var contracts = await _contractRepository.FindAsync(c => c.VendorId == vendorId && c.StallId == dto.StallId && c.IsDeleted != true && c.Status != "Terminated" && c.Status != "TerminatedEarly" && c.Status != "Expired");
            if (!contracts.Any())
            {
                throw new BadRequestException("Bạn không có quyền tạo yêu cầu cho sạp này vì không có hợp đồng hợp lệ.");
            }

            if (dto.RequestType == "ViolationAppeal" && dto.ViolationId.HasValue)
            {
                var vendorViolation = await _violationRepository.GetViolationDetailForVendorAsync(dto.ViolationId.Value, vendorId);

                if (vendorViolation == null)
                {
                    throw new BadRequestException("Không tìm thấy biên bản vi phạm hoặc bạn không có quyền kháng nghị biên bản này.");
                }

                if (vendorViolation.Status == "Appealed" || 
                    vendorViolation.Status == "Approved" || 
                    vendorViolation.Status == "Rejected" || 
                    vendorViolation.Status == "Finalized")
                {
                    throw new BadRequestException("Biên bản này đang trong quá trình xử lý kháng nghị hoặc đã có kết quả, không thể kháng nghị lại.");
                }

                vendorViolation.Status = "Appealed";
                vendorViolation.UpdatedAt = DateTime.UtcNow;
                _violationRepository.Update(vendorViolation);
            }

            var request = new Request
            {
                VendorId = vendorId,
                StallId = dto.StallId,
                RequestType = dto.RequestType,
                ViolationId = dto.ViolationId,
                InvoiceId = dto.InvoiceId,
                Title = dto.Title,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _requestRepository.AddAsync(request);
            await _requestRepository.SaveChangesAsync();

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(request.RequestId);
            return _mapper.Map<RequestDto>(requestWithRelations!);
        }

        public async Task<bool> CancelRequestAsync(int vendorId, int requestId)
        {
            if (requestId <= 0)
                throw new BadRequestException("ID yêu cầu không hợp lệ.");

            var request = await _requestRepository.GetRequestWithRelationsAsync(requestId);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException("Không tìm thấy yêu cầu hoặc bạn không có quyền hủy.");
            }

            if (request.Status != "Pending")
            {
                throw new BadRequestException("Chỉ có thể hủy những yêu cầu đang ở trạng thái Chờ Xử Lý (Pending).");
            }

            request.Status = "Cancelled";
            request.UpdatedAt = DateTime.UtcNow;

            _requestRepository.Update(request);
            await _requestRepository.SaveChangesAsync();

            return true;
        }

        public async Task<RequestDto> ResolveRequestQuoteForVendorAsync(int vendorId, int requestId, VendorQuotationDecisionRequest decision, CancellationToken ct = default)
        {
            var request = await _requestRepository.GetByIdAsync(requestId, ct);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException($"Không tìm thấy yêu cầu sửa chữa ID {requestId}.");
            }

            if (request.RequestType != "FacilityIssue")
            {
                throw new BadRequestException("Chỉ có thể phê duyệt báo giá cho các yêu cầu sửa chữa cơ sở vật chất.");
            }

            if (request.Status != "Quoted")
            {
                throw new BadRequestException("Yêu cầu này không ở trạng thái chờ duyệt báo giá.");
            }

            if (request.PaidBy != "Vendor")
            {
                throw new BadRequestException("Yêu cầu này không do tiểu thương chi trả nên không thể phê duyệt.");
            }

            if (request.IsQuoteApproved != null)
            {
                throw new BadRequestException("Báo giá này đã được xử lý trước đó.");
            }

            request.IsQuoteApproved = decision.Approve;
            
            if (decision.Approve)
            {
                request.Status = "Approved";
            }
            else
            {
                request.Status = "Cancelled";
                request.VendorRejectReason = decision.RejectReason;
            }
            
            request.UpdatedAt = DateTime.UtcNow;

            // Synchronize linked staff task status
            var tasks = await _staffTaskRepository.FindAsync(t => t.RequestId == requestId, ct);
            foreach (var task in tasks)
            {
                if (decision.Approve)
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
                        task.Status = "Cancelled";
                        _staffTaskRepository.Update(task);
                    }
                }
            }

            _requestRepository.Update(request);
            await _requestRepository.SaveChangesAsync(ct);

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(requestId, ct);
            return _mapper.Map<RequestDto>(requestWithRelations!);
        }
    }
}
