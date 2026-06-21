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
        private readonly IMapper _mapper;

        public VendorRequestService(IRequestRepository requestRepository, IContractRepository contractRepository, IViolationRepository violationRepository, IMapper mapper)
        {
            _requestRepository = requestRepository;
            _contractRepository = contractRepository;
            _violationRepository = violationRepository;
            _mapper = mapper;
        }

        public async Task<PagedResult<RequestDto>> GetMyRequestsAsync(int vendorId, RequestQueryParams queryParams)
        {
            var (items, totalCount) = await _requestRepository.GetRequestsPagedAsync(
                vendorId,
                queryParams.StallId,
                queryParams.Status,
                queryParams.RequestType,
                queryParams.SearchTerm,
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

        public async Task<RequestDto?> GetRequestDetailAsync(int vendorId, int requestId)
        {
            var request = await _requestRepository.GetRequestWithRelationsAsync(requestId);
            if (request == null || request.VendorId != vendorId)
            {
                return null;
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> CreateRequestAsync(int vendorId, CreateRequestDto dto)
        {
            // Verify if vendor has a contract for this stall
            var contracts = await _contractRepository.FindAsync(c => c.VendorId == vendorId && c.StallId == dto.StallId && c.IsDeleted != true && c.Status != "Terminated" && c.Status != "Expired");
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

                if (vendorViolation.Status == "Appealed")
                {
                    throw new BadRequestException("Biên bản này đã được kháng nghị rồi.");
                }

                if (vendorViolation.Status == "Finalized")
                {
                    throw new BadRequestException("Biên bản này đã chốt, không thể kháng nghị thêm.");
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
    }
}
