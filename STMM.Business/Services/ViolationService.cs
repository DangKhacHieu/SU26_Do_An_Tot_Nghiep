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
            _logger = logger;
        }

        public async Task<PagedResult<ViolationDto>> GetViolationsAsync(
            int userId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _violationRepository.GetViolationsPagedAsync(
                userId,
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

        public async Task<ViolationDto> GetViolationByIdAsync(
            int id, int userId, CancellationToken ct = default)
        {
            var violation = await _violationRepository.GetViolationWithStallAsync(id, userId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"Violation with ID {id} not found.");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        public async Task<ViolationDto> CreateViolationAsync(
            int userId, CreateViolationRequest request, CancellationToken ct = default)
        {

            var marketId = await GetMarketIdAsync(userId, "staff", ct);
            var stall = await _stallRepository.GetStallForMarketAsync(request.StallId, marketId, ct)
                ?? throw new NotFoundException($"Stall with ID {request.StallId} not found.");

            var types = await _violationTypeRepository.FindAsync(vt => vt.ViolationTypeId == request.ViolationTypeId && vt.IsActive != false, ct);
            var violationType = types.FirstOrDefault();

            if (violationType == null)
            {
                throw new NotFoundException($"Violation type with ID {request.ViolationTypeId} was not found or is inactive.");
            }

            var managers = await _userRepository.GetActiveManagersByMarketAsync(
                marketId, ct);

            var violation = _mapper.Map<Violation>(request);
            violation.CreatedByUserId = userId;
            violation.Status = "Pending";
            violation.CreatedAt = DateTime.UtcNow;
            violation.UpdatedAt = DateTime.UtcNow;

            if ((violation.FineAmount == null || violation.FineAmount == 0) && violationType.DefaultFine.HasValue)
            {
                violation.FineAmount = violationType.DefaultFine.Value;
            }

            await _violationRepository.AddAsync(violation, ct);
            await _violationRepository.SaveChangesAsync(ct);

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
            int managerUserId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var marketId = await GetMarketIdAsync(managerUserId, "manager", ct);
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
            int managerUserId, int id, CancellationToken ct = default)
        {
            var marketId = await GetMarketIdAsync(managerUserId, "manager", ct);
            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(id, marketId, ct);

            if (violation == null)
            {
                throw new NotFoundException($"Violation with ID {id} not found.");
            }

            return _mapper.Map<ViolationDto>(violation);
        }

        private async Task<int> GetMarketIdAsync(int userId, string accountType, CancellationToken ct)
        {
            var user = await _userRepository.GetUserByIdWithRoleAsync(userId, ct);
            if (user?.MarketId == null)
            {
                throw new ForbiddenException($"The {accountType} account is not assigned to a market.");
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
                var user = await _userRepository.GetByIdAsync(accountantUserId.Value, ct);
                marketId = user?.MarketId;
            }

            var list = await _violationRepository.GetAllViolationsWithDetailsAsync(marketId, ct);
            return _mapper.Map<IEnumerable<ViolationDto>>(list);
        }

        public async Task<bool> CreateInvoiceForViolationAsync(int violationId, int accountantUserId, CancellationToken ct = default)
        {
            var accountantUser = await _userRepository.GetByIdAsync(accountantUserId, ct);
            if (accountantUser == null || !accountantUser.MarketId.HasValue)
            {
                throw new ForbiddenException("Kế toán chưa được phân công quản lý chợ.");
            }
            var violation = await _violationRepository.GetViolationDetailsForManagerAsync(violationId, accountantUser.MarketId.Value, ct);
            if (violation == null)
            {
                throw new NotFoundException($"Không tìm thấy biên bản vi phạm ID {violationId}.");
            }

            if (violation.Status == "Paid" || violation.Status == "Finalized")
            {
                throw new BadRequestException("Biên bản vi phạm này đã được xử lý (đã xuất hóa đơn hoặc thanh toán).");
            }

            if (!violation.FineAmount.HasValue || violation.FineAmount.Value <= 0)
            {
                throw new BadRequestException("Biên bản này chưa có số tiền phạt hợp lệ để tạo hóa đơn.");
            }

            var contract = await _contractRepository.GetActiveContractByStallIdAsync(violation.StallId, ct);
            if (contract == null)
            {
                throw new BadRequestException($"Sạp {violation.Stall.Code} hiện không có hợp đồng thuê nào đang hiệu lực để ghi nhận hóa đơn.");
            }

            var feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync("phạt", null, ct);
            if (feeType == null)
            {
                feeType = await _feeTypeRepository.GetFeeTypeByNameContainsAsync("vi phạm", null, ct);
            }

            if (feeType == null)
            {
                throw new BadRequestException("Không tìm thấy Loại phí cấu hình cho 'Tiền phạt' trong hệ thống. Vui lòng tạo Loại phí này trước.");
            }

            var invoice = new Invoice
            {
                ContractId = contract.ContractId,
                Month = DateTime.UtcNow.Month,
                Year = DateTime.UtcNow.Year,
                TotalAmount = violation.FineAmount.Value,
                Status = "Unpaid",
                DueDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(7)),
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            var invoiceDetail = new InvoiceDetail
            {
                FeeTypeId = feeType.FeeTypeId,
                Description = $"Tiền phạt vi phạm: {violation.Title}",
                Quantity = 1,
                UnitPrice = violation.FineAmount.Value,
                Amount = violation.FineAmount.Value,
            };

            invoice.InvoiceDetails.Add(invoiceDetail);

            await _invoiceRepository.AddAsync(invoice, ct);

            // Đổi trạng thái vi phạm thành Đã kết luận
            var violationToUpdate = await _violationRepository.GetByIdAsync(violationId, ct);
            if (violationToUpdate != null)
            {
                violationToUpdate.Status = "Finalized";
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
                throw new BadRequestException($"Tên loại vi phạm '{request.Name}' đã tồn tại.");
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

        public async Task<ViolationTypeDto> UpdateViolationTypeAsync(int id, UpdateViolationTypeRequest request, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null)
            {
                throw new NotFoundException($"Không tìm thấy Loại vi phạm ID {id}.");
            }

            var duplicate = await _violationTypeRepository.IsNameExistsAsync(request.Name, id, vt.MarketId, ct);
            if (duplicate)
            {
                throw new BadRequestException($"Tên loại vi phạm '{request.Name}' đã tồn tại ở loại vi phạm khác.");
            }

            vt.Name = request.Name;
            vt.Description = request.Description;
            vt.DefaultFine = request.DefaultFine;
            vt.IsActive = request.IsActive;

            _violationTypeRepository.Update(vt);
            await _violationTypeRepository.SaveChangesAsync(ct);

            return _mapper.Map<ViolationTypeDto>(vt);
        }

        public async Task<bool> DeleteViolationTypeAsync(int id, CancellationToken ct = default)
        {
            var vt = await _violationTypeRepository.GetByIdAsync(id, ct);
            if (vt == null) return false;

            var inUse = await _violationRepository.IsViolationTypeInUseAsync(id, ct);

            if (inUse)
            {
                throw new BadRequestException($"Không thể xóa loại vi phạm '{vt.Name}' vì đang có biên bản vi phạm sử dụng nó.");
            }

            _violationTypeRepository.Delete(vt);
            await _violationTypeRepository.SaveChangesAsync(ct);
            return true;
        }
    }
}
