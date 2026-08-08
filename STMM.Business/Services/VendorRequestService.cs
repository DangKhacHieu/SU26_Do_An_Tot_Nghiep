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
        private readonly IVendorRepository _vendorRepository;
        private readonly IMapper _mapper;

        public VendorRequestService(
            IRequestRepository requestRepository, 
            IContractRepository contractRepository, 
            IViolationRepository violationRepository, 
            IInvoiceRepository invoiceRepository,
            IStaffTaskRepository staffTaskRepository,
            IVendorRepository vendorRepository,
            IMapper mapper)
        {
            _requestRepository = requestRepository;
            _contractRepository = contractRepository;
            _violationRepository = violationRepository;
            _invoiceRepository = invoiceRepository;
            _staffTaskRepository = staffTaskRepository;
            _vendorRepository = vendorRepository;
            _mapper = mapper;
        }

        public async Task<int> GetVendorIdByUserIdAsync(int userId)
        {
            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId);
            var vendor = vendors.FirstOrDefault();
            if (vendor == null)
            {
                throw new UnauthorizedAccessException("ERR_VENDOR_PROFILE_NOT_FOUND_FOR_THIS_USER");
            }
            return vendor.VendorId;
        }

        public async Task<PagedResult<RequestDto>> GetMyRequestsAsync(int vendorId, RequestQueryParams queryParams)
        {
            if (queryParams.PageNumber < 1)
                throw new BadRequestException("ERR_SO_TRANG_KHONG_HOP_LE");
            
            if (queryParams.PageSize <= 0 || queryParams.PageSize > 100)
                throw new BadRequestException("ERR_KICH_THUOC_TRANG_PHAI_TU_1_DEN_100");

            if (!string.IsNullOrWhiteSpace(queryParams.RequestType))
            {
                var validTypes = new[] { "FacilityIssue", "ViolationAppeal", "InvoiceDispute" };
                if (!validTypes.Contains(queryParams.RequestType.Trim()))
                    throw new BadRequestException("ERR_LOAI_YEU_CAU_KHONG_HOP_LE");
            }

            if (!string.IsNullOrWhiteSpace(queryParams.Status))
            {
                var validStatuses = new[] { "Pending", "Approved", "Rejected", "Cancelled", "In_Progress", "Quoted" };
                if (!validStatuses.Contains(queryParams.Status.Trim()))
                    throw new BadRequestException("ERR_TRANG_THAI_YEU_CAU_KHONG_HOP_LE");
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
                throw new BadRequestException("ERR_ID_YEU_CAU_KHONG_HOP_LE");

            var request = await _requestRepository.GetRequestWithRelationsAsync(requestId);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException("ERR_KHONG_TIM_THAY_YEU_CAU_HOAC_BAN_KHONG_CO_QUYEN_XEM");
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> CreateRequestAsync(int vendorId, CreateRequestDto dto)
        {
            if (dto.StallId <= 0)
                throw new BadRequestException("ERR_VUI_LONG_CHON_SAP_STALLID_HOP_LE");

            if (string.IsNullOrWhiteSpace(dto.Title))
                throw new BadRequestException("ERR_TIEU_DE_KHONG_DUOC_DE_TRONG");

            if (string.IsNullOrWhiteSpace(dto.Description))
                throw new BadRequestException("ERR_MO_TA_KHONG_DUOC_DE_TRONG");

            var validTypes = new[] { "FacilityIssue", "ViolationAppeal", "InvoiceDispute" };
            if (!validTypes.Contains(dto.RequestType))
                throw new BadRequestException("ERR_LOAI_YEU_CAU_KHONG_HOP_LE");

            if (dto.RequestType == "ViolationAppeal")
            {
                if (!dto.ViolationId.HasValue)
                    throw new BadRequestException("ERR_VUI_LONG_CUNG_CAP_ID_BIEN_BAN_VI_PHAM_CAN_KHANG_NG");
            }
            else
            {
                if (dto.ViolationId.HasValue)
                    throw new BadRequestException("ERR_LOAI_YEU_CAU_NAY_KHONG_DUOC_PHEP_DINH_KEM_BIEN_BAN");
            }

            if (dto.RequestType == "InvoiceDispute")
            {
                if (!dto.InvoiceId.HasValue)
                    throw new BadRequestException("ERR_VUI_LONG_CUNG_CAP_ID_HOA_DON_CAN_KHIEU_NAI");
                
                var invoice = await _invoiceRepository.GetInvoiceDetailsWithRelationsAsync(dto.InvoiceId.Value);
                if (invoice == null || invoice.Contract?.VendorId != vendorId)
                    throw new BadRequestException("ERR_KHONG_TIM_THAY_HOA_DON_CAN_KHIEU_NAI_HOAC_HOA_DON");

                if (invoice.Status == "Adjusted")
                {
                    throw new BadRequestException("ERR_HOA_DON_NAY_DA_DUOC_DIEU_CHINH_KHONG_THE_KHIEU_NAI");
                }

                // Check if there is already an active dispute for this invoice
                var existingDispute = await _requestRepository.FindAsync(r => r.InvoiceId == dto.InvoiceId.Value && (r.Status == "Pending" || r.Status == "Reviewing"));
                if (existingDispute.Any())
                {
                    throw new BadRequestException("ERR_HOA_DON_NAY_DANG_DUOC_KHIEU_NAI_KHONG_THE_KHIEU_NA");
                }

                // KHÔNG đổi trạng thái invoice thành Disputed nữa theo requirement mới
            }
            else
            {
                if (dto.InvoiceId.HasValue)
                    throw new BadRequestException("ERR_LOAI_YEU_CAU_NAY_KHONG_DUOC_PHEP_DINH_KEM_HOA_DON");
            }

            // Verify if vendor has a contract for this stall
            var contracts = await _contractRepository.FindAsync(c => c.VendorId == vendorId && c.StallId == dto.StallId && c.IsDeleted != true && c.Status != "Terminated" && c.Status != "TerminatedEarly" && c.Status != "Expired");
            if (!contracts.Any())
            {
                throw new BadRequestException("ERR_BAN_KHONG_CO_QUYEN_TAO_YEU_CAU_CHO_SAP_NAY_VI_KHON");
            }

            if (dto.RequestType == "ViolationAppeal" && dto.ViolationId.HasValue)
            {
                var vendorViolation = await _violationRepository.GetViolationDetailForVendorAsync(dto.ViolationId.Value, vendorId);

                if (vendorViolation == null)
                {
                    throw new BadRequestException("ERR_KHONG_TIM_THAY_BIEN_BAN_VI_PHAM_HOAC_BAN_KHONG_CO");
                }

                if (vendorViolation.Status == "Appealed" || 
                    vendorViolation.Status == "Approved" || 
                    vendorViolation.Status == "Rejected" || 
                    vendorViolation.Status == "Finalized")
                {
                    throw new BadRequestException("ERR_BIEN_BAN_NAY_DANG_TRONG_QUA_TRINH_XU_LY_KHANG_NGHI");
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
                throw new BadRequestException("ERR_ID_YEU_CAU_KHONG_HOP_LE");

            var request = await _requestRepository.GetRequestWithRelationsAsync(requestId);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException("ERR_KHONG_TIM_THAY_YEU_CAU_HOAC_BAN_KHONG_CO_QUYEN_HUY");
            }

            if (request.Status != "Pending")
            {
                throw new BadRequestException("ERR_CHI_CO_THE_HUY_NHUNG_YEU_CAU_DANG_O_TRANG_THAI_CHO");
            }

            request.Status = "Cancelled";
            request.UpdatedAt = DateTime.UtcNow;

            if (request.RequestType == "InvoiceDispute" && request.InvoiceId.HasValue)
            {
                var invoice = await _invoiceRepository.GetByIdAsync(request.InvoiceId.Value);
                if (invoice != null && invoice.Status == "Disputed")
                {
                    // Revert về Unpaid (Phục vụ cho các dữ liệu cũ đã bị đổi thành Disputed)
                    invoice.Status = "Unpaid";
                    _invoiceRepository.Update(invoice);
                }
            }
            
            if (request.RequestType == "ViolationAppeal" && request.ViolationId.HasValue)
            {
                var violation = await _violationRepository.GetByIdAsync(request.ViolationId.Value);
                if (violation != null && violation.Status == "Appealed")
                {
                    violation.Status = "Issued";
                    _violationRepository.Update(violation);
                }
            }

            _requestRepository.Update(request);
            await _requestRepository.SaveChangesAsync();

            return true;
        }

        public async Task<RequestDto> ResolveRequestQuoteForVendorAsync(int vendorId, int requestId, VendorQuotationDecisionRequest decision, CancellationToken ct = default)
        {
            var request = await _requestRepository.GetByIdAsync(requestId, ct);
            if (request == null || request.VendorId != vendorId)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_YEU_CAU_SUA_CHUA_ID_REQUESTID|{requestId}");
            }

            if (request.RequestType != "FacilityIssue")
            {
                throw new BadRequestException("ERR_CHI_CO_THE_PHE_DUYET_BAO_GIA_CHO_CAC_YEU_CAU_SUA_C");
            }

            if (request.Status != "Quoted")
            {
                throw new BadRequestException("ERR_YEU_CAU_NAY_KHONG_O_TRANG_THAI_CHO_DUYET_BAO_GIA");
            }

            if (request.PaidBy != "Vendor")
            {
                throw new BadRequestException("ERR_YEU_CAU_NAY_KHONG_DO_TIEU_THUONG_CHI_TRA_NEN_KHONG");
            }

            if (request.IsQuoteApproved != null)
            {
                throw new BadRequestException("ERR_BAO_GIA_NAY_DA_DUOC_XU_LY_TRUOC_DO");
            }

            request.IsQuoteApproved = decision.IsApproved;
            
            if (decision.IsApproved)
            {
                request.Status = "Approved";
            }
            else
            {
                request.Status = "Cancelled";
                request.VendorRejectReason = decision.Reason;
            }
            
            request.UpdatedAt = DateTime.UtcNow;

            // Synchronize linked staff task status
            var tasks = await _staffTaskRepository.FindAsync(t => t.RequestId == requestId, ct);
            foreach (var task in tasks)
            {
                if (decision.IsApproved)
                {
                    if (task.Status == "PendingManagerReview" || task.Status == "PendingApproval") // StaffTask waits at ManagerReview/Approval
                    {
                        task.Status = "In_Progress";
                        _staffTaskRepository.Update(task);
                    }
                }
                else
                {
                    if (task.Status == "PendingManagerReview" || task.Status == "PendingApproval" || task.Status == "Pending")
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
