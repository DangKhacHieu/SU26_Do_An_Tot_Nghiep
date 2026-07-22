using AutoMapper;
using FluentValidation;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Stall;
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
        private readonly IValidator<CreateContractRequest> _createValidator;
        private readonly IValidator<RenewContractRequest> _renewValidator;

        public ContractService(
            IContractRepository contractRepository,
            IStallRepository stallRepository,
            IVendorRepository vendorRepository,
            IUserRepository userRepository,
            IContractFileRepository contractFileRepository,
            IMapper mapper,
            IValidator<CreateContractRequest> createValidator,
            IValidator<RenewContractRequest> renewValidator)
        {
            _contractRepository = contractRepository;
            _stallRepository = stallRepository;
            _vendorRepository = vendorRepository;
            _userRepository = userRepository;
            _contractFileRepository = contractFileRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _renewValidator = renewValidator;
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
                .FirstOrDefaultAsync(s => s.StallId == request.StallId && s.IsDeleted != true, ct);
            if (stall == null)
            {
                throw new NotFoundException($"Không tìm thấy sạp hàng có ID {request.StallId}.");
            }
            if (callerMarketId.HasValue && stall.Area?.MarketId != callerMarketId.Value)
            {
                throw new BadRequestException("Sạp hàng này không thuộc chợ của bạn.");
            }
            if (stall.Status == "Maintenance")
            {
                throw new BadRequestException("Sạp hàng này đang bảo trì, không thể ký hợp đồng.");
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

            // Mark old contract as Expired
            oldContract.Status = "Expired";
            _contractRepository.Update(oldContract);

            // Create new Contract record
            var newContract = new Contract
            {
                StallId = oldContract.StallId,
                VendorId = oldContract.VendorId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                RentFee = request.RentFee,
                Deposit = request.Deposit,
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

        public async Task<ContractDto> TerminateContractAsync(int contractId, CancellationToken ct)
        {
            var contract = await _contractRepository.GetContractByIdWithDetailsAsync(contractId, ct);
            if (contract == null)
            {
                throw new NotFoundException($"Không tìm thấy hợp đồng có ID {contractId}.");
            }

            contract.Status = "Terminated";
            _contractRepository.Update(contract);

            // Release Stall to Available
            var stall = await _stallRepository.GetByIdAsync(contract.StallId, ct);
            if (stall != null)
            {
                stall.Status = "Available";
                _stallRepository.Update(stall);
            }

            await _contractRepository.SaveChangesAsync(ct);

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
            var (caller, callerMarketId, isManager) = await GetCallerInfoAsync(currentUserId, ct);
            if (isManager && !callerMarketId.HasValue)
            {
                return new List<StallDto>();
            }

            var query = _stallRepository.Query()
                .Include(s => s.Area)
                .Include(s => s.Category)
                .Where(s => s.Status == "Available" && s.IsDeleted != true);

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

            foreach (var url in request.FileUrls)
            {
                if (!string.IsNullOrWhiteSpace(url))
                {
                    var file = new ContractFile
                    {
                        ContractId = contractId,
                        FileUrl = url.Trim()
                    };
                    await _contractFileRepository.AddAsync(file, ct);
                }
            }

            await _contractFileRepository.SaveChangesAsync(ct);

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
    }
}
