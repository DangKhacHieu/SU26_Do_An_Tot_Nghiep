using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Stall;
using STMM.Business.DTOs.Notification;
using STMM.Business.Interfaces;
using STMM.Business.Exceptions;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class ContractService : IContractService
    {
        private readonly IContractRepository _contractRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IVendorRepository _vendorRepository;
        private readonly IUserRepository _userRepository;
        private readonly IContractFileRepository _contractFileRepository;
        private readonly IMapper _mapper;
        private readonly IFileUploadService _fileUploadService;
        private readonly IValidator<CreateContractRequest> _createValidator;
        private readonly IValidator<RenewContractRequest> _renewValidator;
        private readonly INotificationService _notificationService;
        private readonly ILogger<ContractService> _logger;

        public ContractService(
            IContractRepository contractRepository,
            IStallRepository stallRepository,
            IVendorRepository vendorRepository,
            IUserRepository userRepository,
            IContractFileRepository contractFileRepository,
            IMapper mapper,
            IFileUploadService fileUploadService,
            IValidator<CreateContractRequest> createValidator,
            IValidator<RenewContractRequest> renewValidator,
            INotificationService notificationService,
            ILogger<ContractService> logger)
        {
            _contractRepository = contractRepository;
            _stallRepository = stallRepository;
            _vendorRepository = vendorRepository;
            _userRepository = userRepository;
            _contractFileRepository = contractFileRepository;
            _mapper = mapper;
            _fileUploadService = fileUploadService;
            _createValidator = createValidator;
            _renewValidator = renewValidator;
            _notificationService = notificationService;
            _logger = logger;
        }

        private async Task<(User? caller, int? marketId, bool isManager)> GetCallerInfoAsync(int? currentUserId, CancellationToken ct)
        {
            if (!currentUserId.HasValue) return (null, null, false);
            var user = await _userRepository.Query().Include(u => u.Role).FirstOrDefaultAsync(u => u.UserId == currentUserId.Value, ct);
            if (user == null) return (null, null, false);
            bool isManager = string.Equals(user.Role?.Name, "Manager", StringComparison.OrdinalIgnoreCase);
            return (user, user.MarketId, isManager);
        }

        private async Task<int?> GetCallerMarketIdAsync(int? currentUserId, CancellationToken ct)
        {
            var (_, marketId, _) = await GetCallerInfoAsync(currentUserId, ct);
            return marketId;
        }

        public async Task<IEnumerable<ContractDto>> GetContractsAsync(string? search, string? status, int? currentUserId = null, CancellationToken ct = default)
        {
            await CheckAndUpdateExpiredContractsAsync(ct);
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                return new List<ContractDto>();
            }

            var contracts = await _contractRepository.GetContractsAsync(search, status, callerMarketId, ct);
            return _mapper.Map<IEnumerable<ContractDto>>(contracts);
        }

        public async Task<ContractDto?> GetContractByIdAsync(int contractId, int? currentUserId = null, CancellationToken ct = default)
        {
            await CheckAndUpdateExpiredContractsAsync(ct);
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                return null;
            }

            var contract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (contract == null) return null;

            if (callerMarketId.HasValue && contract.Stall?.Area?.MarketId != callerMarketId.Value)
            {
                return null;
            }

            return _mapper.Map<ContractDto>(contract);
        }

        public async Task<ContractDto> CreateContractAsync(CreateContractRequest request, int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                throw new BadRequestException("Tài khoản Quản lý chưa sở hữu chợ nào được phê duyệt. Bạn chỉ có thể tạo hợp đồng sau khi chợ của bạn được phê duyệt.");
            }

            var validationResult = await _createValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Check Stall exists
            var stall = await _stallRepository.Query()
                .Include(s => s.Area)
                    .ThenInclude(a => a.Market)
                .FirstOrDefaultAsync(s => s.StallId == request.StallId 
                                          && s.IsDeleted != true 
                                          && s.Area.IsDeleted != true 
                                          && s.Area.Market.IsDeleted != true, ct);
            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp hàng có ID {request.StallId}.");
            }
            if (callerMarketId.HasValue && stall.Area?.MarketId != callerMarketId.Value)
            {
                throw new BadRequestException("Sạp hàng này không thuộc chợ của bạn.");
            }
            if (stall.Status != "Available")
            {
                throw new BadRequestException("Sạp hàng này không còn trống, không thể ký hợp đồng.");
            }

            // Check if there is already an Active contract on this stall
            var activeContracts = await _contractRepository.FindAsync(c => c.StallId == request.StallId && c.Status == "Active" && c.IsDeleted != true, ct);
            if (activeContracts.Any())
            {
                throw new BadRequestException("Sạp hàng này đang có hợp đồng hoạt động (Active). Hãy chấm dứt hợp đồng cũ trước.");
            }

            // Check User exists and is Vendor
            var user = await _userRepository.Query()
                .Include(u => u.Role)
                .Include(u => u.Vendor)
                .FirstOrDefaultAsync(u => u.UserId == request.UserId && u.IsDeleted != true, ct);
            if (user == null)
            {
                throw new NotFoundException($"Không tìm thấy người dùng có ID {request.UserId}.");
            }
            if (user.Role.Name.ToLower() != "vendor")
            {
                throw new BadRequestException("Người dùng được chọn không có vai trò Tiểu thương (Vendor).");
            }
            if (callerMarketId.HasValue && user.MarketId != callerMarketId.Value)
            {
                throw new BadRequestException("Tiểu thương được chọn không thuộc chợ của bạn.");
            }

            // Ensure Vendor record exists
            var vendor = user.Vendor;
            if (vendor == null)
            {
                vendor = new Vendor
                {
                    UserId = user.UserId,
                    BusinessName = !string.IsNullOrWhiteSpace(request.BusinessName) ? request.BusinessName.Trim() : $"Cơ sở kinh doanh của {user.Name}",
                    TaxCode = !string.IsNullOrWhiteSpace(request.TaxCode) ? request.TaxCode.Trim() : null,
                    BankAccount = !string.IsNullOrWhiteSpace(request.BankAccount) ? request.BankAccount.Trim() : null,
                    BankName = !string.IsNullOrWhiteSpace(request.BankName) ? request.BankName.Trim() : null,
                    Address = "Chưa cập nhật",
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                };
                await _vendorRepository.AddAsync(vendor, ct);
                await _vendorRepository.SaveChangesAsync(ct);
            }
            else
            {
                if (!string.IsNullOrWhiteSpace(request.BusinessName))
                {
                    vendor.BusinessName = request.BusinessName.Trim();
                }
                if (!string.IsNullOrWhiteSpace(request.TaxCode))
                {
                    vendor.TaxCode = request.TaxCode.Trim();
                }
                if (!string.IsNullOrWhiteSpace(request.BankAccount))
                {
                    vendor.BankAccount = request.BankAccount.Trim();
                }
                if (!string.IsNullOrWhiteSpace(request.BankName))
                {
                    vendor.BankName = request.BankName.Trim();
                }
                _vendorRepository.Update(vendor);
                await _vendorRepository.SaveChangesAsync(ct);
            }

            // Create Contract
            var contract = new Contract
            {
                StallId = request.StallId,
                VendorId = vendor.VendorId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RentFee = request.RentFee,
                Deposit = request.Deposit,
                DepositRefunded = 0,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await _contractRepository.AddAsync(contract, ct);

            // Update Stall Status
            stall.Status = "Rented";
            _stallRepository.Update(stall);

            await _contractRepository.SaveChangesAsync(ct);

            return await GetContractByIdAsync(contract.ContractId, currentUserId, ct) ?? _mapper.Map<ContractDto>(contract);
        }

        public async Task<ContractDto> RenewContractAsync(int contractId, RenewContractRequest request, CancellationToken ct)
        {
            var validationResult = await _renewValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", validationResult.Errors.Select(e => e.ErrorMessage)));
            }

            var oldContract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (oldContract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng cũ có ID {contractId}.");
            }

            if (request.StartDate <= oldContract.EndDate)
            {
                throw new BadRequestException("Ngày bắt đầu hợp đồng mới phải sau ngày kết thúc của hợp đồng hiện tại.");
            }

            // Only mark the old contract as Expired if its EndDate has actually passed.
            // If it is in the future, we keep it Active, and ContractStatusWorker will handle transitioning it to Expired when the day arrives.
            if (DateOnly.FromDateTime(DateTime.Today) > oldContract.EndDate)
            {
                oldContract.Status = "Expired";
                _contractRepository.Update(oldContract);
            }

            // Create new Contract record
            var newContract = new Contract
            {
                StallId = oldContract.StallId,
                VendorId = oldContract.VendorId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RentFee = request.RentFee,
                Deposit = request.Deposit,
                DepositRefunded = 0,
                Status = "Active",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            };

            await _contractRepository.AddAsync(newContract, ct);

            // Keep Stall status as Rented
            var stall = await _stallRepository.GetByIdAsync(oldContract.StallId, ct);
            if (stall != null)
            {
                stall.Status = "Rented";
                _stallRepository.Update(stall);
            }

            await _contractRepository.SaveChangesAsync(ct);

            return await GetContractByIdAsync(newContract.ContractId, ct: ct) ?? _mapper.Map<ContractDto>(newContract);
        }

        public async Task<ContractDto> TerminateContractAsync(int contractId, DateOnly? terminationDate, int? currentUserId, CancellationToken ct)
        {
            var contract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng có ID {contractId}.");
            }

            var targetTerminationDate = terminationDate ?? DateOnly.FromDateTime(DateTime.Today);
            var isEarly = targetTerminationDate < contract.EndDate;

            if (isEarly)
            {
                contract.Status = "TerminatedEarly";
                contract.DepositRefunded = 0; // Tiền cọc tịch thu do vi phạm/chấm dứt trước hạn
            }
            else
            {
                contract.Status = "Terminated";
                contract.DepositRefunded = contract.Deposit; // Hoàn trả lại toàn bộ tiền cọc cho tiểu thương
            }

            _contractRepository.Update(contract);

            // Release Stall to Available
            var stall = await _stallRepository.GetByIdAsync(contract.StallId, ct);
            if (stall != null)
            {
                stall.Status = "Available";
                _stallRepository.Update(stall);
            }

            await _contractRepository.SaveChangesAsync(ct);

            // Gửi thông báo cho tiểu thương của hợp đồng
            if (contract.Vendor != null)
            {
                var notiTitle = isEarly
                    ? "Hợp đồng thuê sạp đã chấm dứt (Chấm dứt trước thời hạn)"
                    : "Hợp đồng thuê sạp đã chấm dứt (Chấm dứt đúng hạn)";
                var notiContent = isEarly
                    ? $"Hợp đồng thuê sạp {contract.Stall?.Code ?? ""} của bạn đã bị chấm dứt trước thời hạn vào ngày {targetTerminationDate:dd/MM/yyyy}. Tiền đặt cọc sẽ KHÔNG được hoàn trả."
                    : $"Hợp đồng thuê sạp {contract.Stall?.Code ?? ""} của bạn đã được chấm dứt đúng hạn/quá hạn vào ngày {targetTerminationDate:dd/MM/yyyy}. Tiền đặt cọc sẽ ĐƯỢC hoàn trả.";

                await _notificationService.CreateAsync(new CreateNotificationRequest
                {
                    Title = notiTitle,
                    Content = notiContent,
                    NotiType = "System",
                    CreatedByUserId = currentUserId ?? 0,
                    TargetUserId = contract.Vendor.UserId
                }, ct);
            }

            return _mapper.Map<ContractDto>(contract);
        }

        public async Task<IEnumerable<ContractVendorDto>> GetContractVendorsAsync(int? currentUserId = null, CancellationToken ct = default)
        {
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                return new List<ContractVendorDto>();
            }

            var query = _userRepository.Query()
                .Include(u => u.Role)
                .Include(u => u.Vendor)
                .Where(u => u.Role.Name.ToLower() == "vendor" && u.IsDeleted != true);

            if (callerMarketId.HasValue)
            {
                query = query.Where(u => u.MarketId == callerMarketId.Value);
            }

            var vendorUsers = await query.ToListAsync(ct);

            var result = new List<ContractVendorDto>();
            foreach (var u in vendorUsers)
            {
                result.Add(new ContractVendorDto
                {
                    UserId = u.UserId,
                    VendorId = u.Vendor?.VendorId ?? 0,
                    Name = u.Name,
                    Email = u.Email,
                    Phone = u.Phone,
                    Cccd = u.Cccd,
                    BusinessName = u.Vendor?.BusinessName ?? $"Cơ sở kinh doanh của {u.Name}",
                    TaxCode = u.Vendor?.TaxCode,
                    Address = u.Vendor?.Address ?? "Chưa cập nhật",
                    BankAccount = u.Vendor?.BankAccount,
                    BankName = u.Vendor?.BankName
                });
            }

            return result;
        }

        public async Task<IEnumerable<StallDto>> GetAvailableStallsAsync(int? currentUserId = null, CancellationToken ct = default)
        {
            await CheckAndUpdateExpiredContractsAsync(ct);
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                return new List<StallDto>();
            }

            var today = DateOnly.FromDateTime(DateTime.Today);

            var query = _stallRepository.Query()
                .Include(s => s.Area)
                    .ThenInclude(a => a.Market)
                .Include(s => s.Category)
                .Where(s => s.Status == "Available" 
                            && s.IsDeleted != true
                            && s.Area.IsDeleted != true
                            && s.Area.Market.IsDeleted != true
                            && !s.Contracts.Any(c => c.Status == "Active" && c.EndDate >= today && c.IsDeleted != true));

            if (callerMarketId.HasValue)
            {
                query = query.Where(s => s.Area.MarketId == callerMarketId.Value);
            }

            var stalls = await query.ToListAsync(ct);

            return _mapper.Map<IEnumerable<StallDto>>(stalls);
        }

        public async Task<ContractDto> AttachSignedFilesAsync(int contractId, AttachContractFilesRequest request, CancellationToken ct)
        {
            var contract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng có ID {contractId}.");
            }

            if (request.Files == null || request.Files.Count == 0)
            {
                throw new BadRequestException("Cần đính kèm ít nhất 1 file bản quét hợp đồng.");
            }

            var uploadedUrls = await _fileUploadService.UploadImagesAsync(request.Files, "contract-files", maxFiles: 10, ct: ct);

            foreach (var url in uploadedUrls)
            {
                var file = new ContractFile
                {
                    ContractId = contractId,
                    FileUrl = url
                };
                await _contractFileRepository.AddAsync(file, ct);
            }

            try
            {
                await _contractFileRepository.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to save contract files to database. Cleaning up uploaded Cloudinary assets.");
                await _fileUploadService.DeleteImagesAsync(uploadedUrls, ct);
                throw;
            }

            var updatedContract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            return _mapper.Map<ContractDto>(updatedContract ?? contract);
        }

        public async Task<ContractDto> UpdateContractVendorInfoAsync(int contractId, UpdateContractVendorInfoRequest request, CancellationToken ct)
        {
            var contract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng có ID {contractId}.");
            }

            var vendor = await _vendorRepository.GetByIdAsync(contract.VendorId, ct);
            if (vendor == null)
            {
                throw new NotFoundException($"Không tìm thấy thông tin tiểu thương liên kết với hợp đồng.");
            }

            if (request.BusinessName != null)
            {
                vendor.BusinessName = request.BusinessName.Trim();
            }
            if (request.TaxCode != null)
            {
                vendor.TaxCode = string.IsNullOrWhiteSpace(request.TaxCode) ? null : request.TaxCode.Trim();
            }
            if (request.BankAccount != null)
            {
                vendor.BankAccount = string.IsNullOrWhiteSpace(request.BankAccount) ? null : request.BankAccount.Trim();
            }
            if (request.BankName != null)
            {
                vendor.BankName = string.IsNullOrWhiteSpace(request.BankName) ? null : request.BankName.Trim();
            }
            if (request.Address != null)
            {
                vendor.Address = string.IsNullOrWhiteSpace(request.Address) ? null : request.Address.Trim();
            }

            _vendorRepository.Update(vendor);
            await _vendorRepository.SaveChangesAsync(ct);

            var updatedContract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            return _mapper.Map<ContractDto>(updatedContract ?? contract);
        }

        private async Task CheckAndUpdateExpiredContractsAsync(CancellationToken ct)
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            
            // Query active contracts that have expired (EndDate < Today)
            var expiredContracts = await _contractRepository.Query()
                .Include(c => c.Stall)
                .Where(c => c.Status == "Active" && c.EndDate < today && c.IsDeleted != true)
                .ToListAsync(ct);

            if (expiredContracts.Any())
            {
                foreach (var contract in expiredContracts)
                {
                    contract.Status = "Expired";
                    _contractRepository.Update(contract);

                    // Release stall unless there is another active contract on it
                    var stallId = contract.StallId;
                    var hasOtherActive = await _contractRepository.Query().AnyAsync(
                        c => c.StallId == stallId
                             && c.Status == "Active"
                             && c.ContractId != contract.ContractId
                             && c.IsDeleted != true
                             && c.StartDate <= today,
                        ct
                    );

                    if (!hasOtherActive)
                    {
                        var stall = await _stallRepository.GetByIdAsync(stallId, ct);
                        if (stall != null && stall.Status == "Rented")
                        {
                            stall.Status = "Available";
                            _stallRepository.Update(stall);
                        }
                    }
                }
                await _contractRepository.SaveChangesAsync(ct);
            }
        }
    }
}
