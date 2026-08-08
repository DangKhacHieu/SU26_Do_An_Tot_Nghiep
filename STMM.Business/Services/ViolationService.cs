using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;
using STMM.Business.DTOs.Notification;
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
    public class ViolationService : IViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IViolationTypeRepository _violationTypeRepository;
        private readonly IMapper _mapper;
        private readonly INotificationService _notificationService;
        private readonly IUserRepository _userRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IFeeTypeRepository _feeTypeRepository;
        private readonly IInvoiceRepository _invoiceRepository;
        private readonly IFileUploadService _fileUploadService;
        private readonly ILogger<ViolationService> _logger;

        public ViolationService(
            IViolationRepository violationRepository,
            IStallRepository stallRepository,
            IViolationTypeRepository violationTypeRepository,
            IMapper mapper,
            INotificationService notificationService,
            IUserRepository userRepository,
            IContractRepository contractRepository,
            IFeeTypeRepository feeTypeRepository,
            IInvoiceRepository invoiceRepository,
            IFileUploadService fileUploadService,
            ILogger<ViolationService> logger)
        {
            _violationRepository = violationRepository;
            _stallRepository = stallRepository;
            _violationTypeRepository = violationTypeRepository;
            _mapper = mapper;
            _notificationService = notificationService;
            _userRepository = userRepository;
            _contractRepository = contractRepository;
            _feeTypeRepository = feeTypeRepository;
            _invoiceRepository = invoiceRepository;
            _fileUploadService = fileUploadService;
            _logger = logger;
        }

        public async Task<IReadOnlyList<ViolationDto>> GetViolationsAsync(
            int userId,
            CancellationToken ct = default)
        {
            var items = await _violationRepository.GetViolationsForStaffAsync(userId, ct);
            return _mapper.Map<List<ViolationDto>>(items);
        }

        public async Task<ViolationDto> GetViolationByIdAsync(
            int id, int userId, CancellationToken ct = default)
        {
            var violation = await _violationRepository.GetViolationWithStallAsync(id, userId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"ERR_VIOLATION_WITH_ID_ID_NOT_FOUND|{id}");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<ViolationDto> CreateViolationAsync(
            int userId, CreateViolationRequest request, CancellationToken ct = default)
        {

            var marketId = await GetMarketIdAsync(userId, "staff", ct);
            var effectiveDate = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));
            var stall = await _stallRepository.GetEligibleRentedStallForMarketAsync(request.StallId, marketId, effectiveDate, ct)
                ?? throw new NotFoundException($"ERR_STALL_WITH_ID_REQUEST_STALLID_NOT_FOUND|{request.StallId}");

            var types = await _violationTypeRepository.FindAsync(
                vt => vt.ViolationTypeId == request.ViolationTypeId &&
                      vt.IsActive != false &&
                      (vt.MarketId == null || vt.MarketId == marketId),
                ct);
            var violationType = types.FirstOrDefault();

            if (violationType == null)
            {
                throw new NotFoundException($"ERR_VIOLATION_TYPE_WITH_ID_REQUEST_VIOLATIONTYPEID_WAS|{request.ViolationTypeId}");
            }

            var managers = await _userRepository.GetActiveManagersByMarketAsync(
                marketId, ct);

            var uploadedUrl = await _fileUploadService.UploadImageAsync(request.Image, "violations", ct);

            var violation = _mapper.Map<Violation>(request);
            violation.CreatedByUserId = userId;
            violation.ImageUrl = uploadedUrl;
            violation.Status = "Pending";
            violation.CreatedAt = DateTime.UtcNow;
            violation.UpdatedAt = DateTime.UtcNow;

            try
            {
                await _violationRepository.AddAsync(violation, ct);
                await _violationRepository.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save Violation to database. Cleaning up uploaded Cloudinary image.");
                await _fileUploadService.DeleteImageAsync(uploadedUrl, ct);
                throw;
            }

            violation.Stall = stall;
            violation.ViolationType = violationType;

            foreach (var manager in managers)
            {
                try
                {
                    await _notificationService.CreateAsync(new DTOs.Notification.CreateNotificationRequest
                    {
                        Title = "New Violation Report",
                        Content = $"A new violation report is pending approval for stall {stall.Code}.",
                        NotiType = "Violation",
                        CreatedByUserId = userId,
                        TargetUserId = manager.UserId
                    }, ct);
                }
                catch (Exception exception)
                {
                    _logger.LogError(
                        exception,
                        "Unable to notify manager {ManagerUserId} about violation {ViolationId}.",
                        manager.UserId,
                        violation.ViolationId);
                }
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<IEnumerable<ViolationTypeDto>> GetViolationTypesAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var types = await _violationTypeRepository.FindAsync(vt => vt.IsActive != false && (vt.MarketId == null || vt.MarketId == user!.MarketId), ct);
            return _mapper.Map<IEnumerable<ViolationTypeDto>>(types);
        }

        public async Task<PagedResult<ViolationDto>> GetViolationsForManagerAsync(
            int? managerUserId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            int? marketId = null;
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    return new PagedResult<ViolationDto>
                    {
                        Items = new List<ViolationDto>(),
                        TotalCount = 0,
                        PageNumber = queryParams.PageNumber,
                        PageSize = queryParams.PageSize
                    };
                }
                marketId = manager?.MarketId;
            }

            var (items, totalCount) = await _violationRepository.GetViolationsPagedForManagerAsync(
                marketId,
                queryParams.Status,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            return new PagedResult<ViolationDto>
            {
                Items = _mapper.Map<IEnumerable<ViolationDto>>(items),
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<ViolationDto> GetViolationByIdForManagerAsync(
            int? managerUserId, int id, CancellationToken ct = default)
        {
            int? marketId = null;
            if (managerUserId.HasValue)
            {
                var manager = await _userRepository.GetByIdAsync(managerUserId.Value, ct);
                if (manager != null && manager.MarketId == null)
                {
                    throw new NotFoundException($"ERR_VIOLATION_WITH_ID_ID_NOT_FOUND|{id}");
                }
                marketId = manager?.MarketId;
            }

            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(id, marketId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"ERR_VIOLATION_WITH_ID_ID_NOT_FOUND|{id}");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        private async Task<int> GetMarketIdAsync(int userId, string accountType, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException($"ERR_THE_ACCOUNTTYPE_ACCOUNT_IS_NOT_ASSIGNED_TO_A_MARKE|{accountType}");
            }

            return user.MarketId.Value;
        }

        public async Task<bool> SimulateViolationAppealAsync(int violationId, CancellationToken ct = default)
        {
            return await _violationRepository.SimulateViolationAppealAsync(violationId, ct);
        }

        // --- ACCOUNTANT ADDITIONS ---

        public async Task<IEnumerable<ViolationDto>> GetAllViolationsAsync(int? accountantUserId = null, CancellationToken ct = default)
        {
            int? marketId = null;
            if (accountantUserId.HasValue)
            {
                var user = await _userRepository.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == accountantUserId.Value, ct);
                if (user != null)
                {
                    if (!user.MarketId.HasValue && (user.Role?.Name == "Manager" || user.Role?.Name == "Accountant"))
                    {
                        return new List<ViolationDto>();
                    }
                    marketId = user.MarketId;
                }
            }

            var list = await _violationRepository.GetAllViolationsWithDetailsAsync(marketId, ct);
            return _mapper.Map<IEnumerable<ViolationDto>>(list);
        }

        public async Task<bool> FinalizeViolationAsync(int managerUserId, int violationId, CancellationToken ct = default)
        {
            var managerUser = await _userRepository.GetByIdAsync(managerUserId, ct);
            if (managerUser == null || !managerUser.MarketId.HasValue)
            {
                throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_THAO_TAC_TREN_CHO_NAY");
            }

            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(violationId, managerUser.MarketId.Value, ct);
            if (violation == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_BIEN_BAN_VI_PHAM_ID_VIOLATIONID|{violationId}");
            }

            if (violation.Status != "Pending" && violation.Status != "Notified")
            {
                throw new BadRequestException("ERR_CHI_CO_THE_CHOT_CAC_VI_PHAM_O_TRANG_THAI_PENDING_H");
            }

            var violationToUpdate = await _violationRepository.GetByIdAsync(violationId, ct);
            if (violationToUpdate != null)
            {
                violationToUpdate.Status = "FinalApproved";
                violationToUpdate.UpdatedAt = DateTime.UtcNow;
                await _violationRepository.SaveChangesAsync(ct);
                return true;
            }

            return false;
        }

        public async Task<bool> CreateInvoiceForViolationAsync(int violationId, int accountantUserId, CreateViolationInvoiceRequest? request = null, CancellationToken ct = default)
        {
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser == null || !accountantUser.MarketId.HasValue)
            {
                throw new ForbiddenException("ERR_KE_TOAN_CHUA_DUOC_PHAN_CONG_QUAN_LY_CHO");
            }
            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(violationId, accountantUser.MarketId.Value, ct);
            if (violation == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_BIEN_BAN_VI_PHAM_ID_VIOLATIONID|{violationId}");
            }

            if (violation.Status != "FinalApproved")
            {
                throw new BadRequestException("ERR_CHI_CO_THE_XUAT_HOA_DON_CHO_CAC_VI_PHAM_DA_CO_QUYE");
            }

            if (!violation.FineAmount.HasValue || violation.FineAmount.Value <= 0)
            {
                throw new BadRequestException("ERR_BIEN_BAN_NAY_CHUA_CO_SO_TIEN_PHAT_HOP_LE_DE_TAO_HO");
            }

            var contract = await _contractRepository.GetActiveContractByStallIdAsync(violation.StallId, ct);
            if (contract == null)
            {
                throw new BadRequestException($"ERR_SAP_VIOLATION_STALL_CODE_HIEN_KHONG_CO_HOP_DONG_TH|{violation.Stall.Code}");
            }

            var feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync("phạt", null, ct);
            if (feeType == null)
            {
                feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync("vi phạm", null, ct);
            }

            if (feeType == null)
            {
                throw new BadRequestException("ERR_KHONG_TIM_THAY_LOAI_PHI_CAU_HINH_CHO_TIEN_PHAT_TRO");
            }

            var invoice = new Invoice
            {
                ContractId = contract.ContractId,
                Month = DateTime.UtcNow.Month,
                Year = DateTime.UtcNow.Year,
                TotalAmount = request?.Amount ?? violation.FineAmount.Value,
                Status = "Unpaid",
                InvoiceType = "Violation",
                ViolationId = violationId,
                DueDate = request?.DueDate ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            var invoiceDetail = new InvoiceDetail
            {
                FeeTypeId = feeType.FeeTypeId,
                Description = string.IsNullOrWhiteSpace(request?.Description) ? $"Tiền phạt vi phạm: {violation.Title}" : request.Description,
                Quantity = 1,
                UnitPrice = request?.Amount ?? violation.FineAmount.Value,
                Amount = request?.Amount ?? violation.FineAmount.Value,
            };

            invoice.InvoiceDetails.Add(invoiceDetail);

            await _invoiceRepository.AddAsync(invoice, ct);

            // Đổi trạng thái vi phạm thành Invoiced
            var violationToUpdate = await _violationRepository.GetByIdAsync(violationId, ct);
            if (violationToUpdate != null)
            {
                violationToUpdate.Status = "Invoiced";
                violationToUpdate.UpdatedAt = DateTime.UtcNow;
            }

            await _invoiceRepository.SaveChangesAsync(ct);
            await _violationRepository.SaveChangesAsync(ct);

            // Tự động gửi thông báo cho tiểu thương
            await _notificationService.CreateAsync(new CreateNotificationRequest
            {
                Title = "Thông báo: Đã phát hành Hóa đơn phạt",
                Content = $"Hóa đơn phạt vi phạm '{violation.Title}' với số tiền {violation.FineAmount.Value:N0} VNĐ đã được tạo. Vui lòng kiểm tra và thanh toán.",
                NotiType = "Invoice",
                CreatedByUserId = accountantUserId,
                TargetUserId = contract.VendorId
            }, ct);

            return true;
        }

        public async Task<IEnumerable<ViolationTypeDto>> GetAllViolationTypesWithInactiveAsync(int userId, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);
            var list = await _violationTypeRepository.GetAllAsync(user?.MarketId, ct);
            return _mapper.Map<IEnumerable<ViolationTypeDto>>(list);
        }

        public async Task<ViolationTypeDto> CreateViolationTypeAsync(int userId, CreateViolationTypeRequest request, CancellationToken ct = default)
        {
            var user = await _userRepository.GetByIdAsync(userId, ct);

            var duplicate = await _violationTypeRepository.IsNameExistsAsync(request.Name, null, user?.MarketId, ct);
            if (duplicate)
            {
                throw new BadRequestException($"ERR_TEN_LOAI_VI_PHAM_REQUEST_NAME_DA_TON_TAI|{request.Name}");
            }

            var vt = new ViolationType
            {
                Name = request.Name,
                Description = request.Description,
                DefaultFine = request.DefaultFine,
                IsActive = true,
                MarketId = user?.MarketId
            };

            await _violationTypeRepository.AddAsync(vt, ct);
            await _violationTypeRepository.SaveChangesAsync(ct);

            return _mapper.Map<ViolationTypeDto>(vt);
        }

        public async Task<ViolationTypeDto> UpdateViolationTypeAsync(int userId, int id, UpdateViolationTypeRequest request, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null)
            {
                throw new NotFoundException($"ERR_KHONG_TIM_THAY_LOAI_VI_PHAM_ID_ID|{id}");
            }

            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && vt.MarketId != user.MarketId)
            {
                if (vt.MarketId == null)
                    throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_SUA_LOAI_VI_PHAM_CHUNG_CUA_HE_THONG");
                else
                    throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_SUA_LOAI_VI_PHAM_CUA_CHO_KHAC");
            }

            var duplicate = await _violationTypeRepository.IsNameExistsAsync(request.Name, id, vt.MarketId, ct);
            if (duplicate)
            {
                throw new BadRequestException($"ERR_TEN_LOAI_VI_PHAM_REQUEST_NAME_DA_TON_TAI_O_LOAI_VI|{request.Name}");
            }

            vt.Name = request.Name;
            vt.Description = request.Description;
            vt.DefaultFine = request.DefaultFine;
            vt.IsActive = request.IsActive;

            _violationTypeRepository.Update(vt);
            await _violationTypeRepository.SaveChangesAsync(ct);

            return _mapper.Map<ViolationTypeDto>(vt);
        }

        public async Task<bool> DeleteViolationTypeAsync(int userId, int id, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null) return false;

            var user = await _userRepository.GetByIdAsync(userId, ct);
            if (user?.MarketId != null && vt.MarketId != user.MarketId)
            {
                if (vt.MarketId == null)
                    throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_XOA_LOAI_VI_PHAM_CHUNG_CUA_HE_THONG");
                else
                    throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_XOA_LOAI_VI_PHAM_CUA_CHO_KHAC");
            }

            var inUse = await _violationRepository.IsViolationTypeInUseAsync(id, ct);

            if (inUse)
            {
                throw new BadRequestException($"ERR_KHONG_THE_XOA_LOAI_VI_PHAM_VT_NAME_VI_DANG_CO_BIEN|{vt.Name}");
            }

            _violationTypeRepository.Delete(vt);
            await _violationTypeRepository.SaveChangesAsync(ct);
            return true;
        }
    }
}
