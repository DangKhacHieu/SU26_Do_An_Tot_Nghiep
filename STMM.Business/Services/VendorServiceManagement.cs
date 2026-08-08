using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Service;
using STMM.Business.DTOs.Stall;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services;

public class VendorServiceManagement : IVendorServiceManagement
{
    private readonly IServiceRepository _serviceRepository;
    private readonly IServiceRegistrationRepository _serviceRegistrationRepository;
    private readonly IInvoiceRepository _invoiceRepository;
    private readonly IContractRepository _contractRepository;
    private readonly IStallRepository _stallRepository;
    private readonly IVendorRepository _vendorRepository;

    public VendorServiceManagement(
        IServiceRepository serviceRepository,
        IServiceRegistrationRepository serviceRegistrationRepository,
        IInvoiceRepository invoiceRepository,
        IContractRepository contractRepository,
        IStallRepository stallRepository,
        IVendorRepository vendorRepository)
    {
        _serviceRepository = serviceRepository;
        _serviceRegistrationRepository = serviceRegistrationRepository;
        _invoiceRepository = invoiceRepository;
        _contractRepository = contractRepository;
        _stallRepository = stallRepository;
        _vendorRepository = vendorRepository;
    }

    public async Task<int> GetVendorIdByUserIdAsync(int userId, CancellationToken ct = default)
    {
        var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId, ct);
        var vendor = vendors.FirstOrDefault();
        if (vendor != null)
        {
            return vendor.VendorId;
        }
        throw new UnauthorizedAccessException("ERR_KHONG_XAC_DINH_DUOC_DANH_TINH_NGUOI_BAN");
    }

    public async Task<IEnumerable<ServiceDto>> GetAvailableServicesAsync(int vendorId, CancellationToken ct = default)
    {
        // Find which markets the vendor is operating in based on their contracts
        var marketIds = await _contractRepository.Query()
            .Include(c => c.Stall)
            .ThenInclude(s => s.Area)
            .Where(c => c.VendorId == vendorId && (c.Status == "Active" || c.Status == "Pending" || c.Status == "PendingApproval"))
            .Select(c => c.Stall.Area.MarketId)
            .Distinct()
            .ToListAsync(ct);

        // Get all active services that belong to the vendor's markets (or global services where MarketId is null)
        var services = await _serviceRepository.Query()
            .Where(s => s.IsActive == true && (s.MarketId == null || marketIds.Contains(s.MarketId.Value)))
            .ToListAsync(ct);
        
        return services.Select(s => new ServiceDto
        {
            ServiceId = s.ServiceId,
            Name = s.Name,
            Description = s.Description,
            Price = s.Price,
            BillingCycle = s.BillingCycle,
            FeeTypeId = s.FeeTypeId
        });
    }

    public async Task<IEnumerable<ServiceRegistrationDto>> GetMyServicesAsync(int vendorId, CancellationToken ct = default)
    {
        // Load registrations with Service and Stall included
        var registrations = await _serviceRegistrationRepository.Query()
            .Include(r => r.Service)
            .Include(r => r.Stall)
            .Where(r => r.VendorId == vendorId)
            .ToListAsync(ct);

        return registrations.OrderByDescending(r => r.RegisteredAt).Select(r => new ServiceRegistrationDto
        {
            RegistrationId = r.RegistrationId,
            ServiceId = r.ServiceId,
            ServiceName = r.Service?.Name ?? "Unknown",
            StallId = r.StallId,
            StallCode = r.Stall?.Code ?? "Unknown",
            Status = r.Status,
            Price = r.Service?.Price ?? 0,
            BillingCycle = r.Service?.BillingCycle,
            RegisteredAt = r.RegisteredAt,
            CancelledAt = r.CancelledAt,
            EndDate = r.EndDate,
            IsAutoRenew = r.IsAutoRenew
        });
    }

    public async Task<ServiceRegistrationDto> GetServiceDetailAsync(int vendorId, int registrationId, CancellationToken ct = default)
    {
        if (registrationId <= 0)
            throw new ArgumentException("ERR_ID_DANG_KY_DICH_VU_KHONG_HOP_LE");

        var registration = await _serviceRegistrationRepository.GetRegistrationWithRelationsAsync(registrationId);
        
        if (registration == null)
            throw new KeyNotFoundException("ERR_KHONG_TIM_THAY_THONG_TIN_DANG_KY_DICH_VU");
            
        if (registration.VendorId != vendorId)
            throw new UnauthorizedAccessException("ERR_BAN_KHONG_CO_QUYEN_TRUY_CAP_THONG_TIN_DICH_VU_NAY");

        if (registration.Service == null)
            throw new InvalidOperationException("ERR_KHONG_TIM_THAY_THONG_TIN_DICH_VU");

        return new ServiceRegistrationDto
        {
            RegistrationId = registration.RegistrationId,
            ServiceId = registration.ServiceId,
            ServiceName = registration.Service?.Name ?? "Unknown",
            StallId = registration.StallId,
            StallCode = registration.Stall?.Code ?? "Unknown",
            Status = registration.Status,
            Price = registration.Service?.Price ?? 0,
            BillingCycle = registration.Service?.BillingCycle,
            RegisteredAt = registration.RegisteredAt,
            CancelledAt = registration.CancelledAt,
            EndDate = registration.EndDate,
            IsAutoRenew = registration.IsAutoRenew
        };
    }

    public async Task<IEnumerable<StallDto>> GetMyStallsAsync(int vendorId, CancellationToken ct = default)
    {
        var vendorContracts = await _contractRepository.Query()
            .Include(c => c.Stall)
            .Where(c => c.VendorId == vendorId && (c.Status == "Active" || c.Status == "Pending" || c.Status == "PendingApproval"))
            .ToListAsync(ct);

        var stalls = vendorContracts.Select(c => c.Stall).Where(s => s != null).DistinctBy(s => s.StallId);
        
        return stalls.Select(s => new StallDto
        {
            StallId = s.StallId,
            Code = s.Code,
            AreaId = s.AreaId,
            CategoryId = s.CategoryId,
            Size = s.Size,
            Status = s.Status
        });
    }

    public async Task<ServiceRegistrationDto> RegisterServiceAsync(int vendorId, RegisterServiceRequest request, CancellationToken ct = default)
    {
        if (request.StallId <= 0 || request.ServiceId <= 0)
        {
            throw new ArgumentException("ERR_THONG_TIN_ID_SAP_HOAC_ID_DICH_VU_KHONG_HOP_LE");
        }

        // A.4.1 Debt Restriction
        var vendorContracts = await _contractRepository.FindAsync(c => c.VendorId == vendorId && (c.Status == "Active" || c.Status == "Pending" || c.Status == "PendingApproval"), ct);
        var contractIds = vendorContracts.Select(c => c.ContractId).ToList();

        var thirtyDaysAgo = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(-30));
        var unpaidInvoices = await _invoiceRepository.FindAsync(
            i => contractIds.Contains(i.ContractId) && i.Status == "Unpaid" && i.DueDate != null && i.DueDate < thirtyDaysAgo, 
            ct);

        if (unpaidInvoices.Any())
        {
            throw new BadRequestException("ERR_BAN_CO_HOA_DON_QUA_HAN_CHUA_THANH_TOAN_VUI_LONG_HO");
        }

        // Verify stall belongs to vendor
        var stallIsRentedByVendor = vendorContracts.Any(c => c.StallId == request.StallId);
        if (!stallIsRentedByVendor)
        {
            throw new BadRequestException("ERR_BAN_KHONG_CO_QUYEN_DANG_KY_DICH_VU_CHO_SAP_NAY");
        }

        // Check if service exists
        var service = await _serviceRepository.GetByIdAsync(request.ServiceId, ct);
        if (service == null || service.IsActive != true)
        {
            throw new BadRequestException("ERR_DICH_VU_NAY_HIEN_KHONG_CON_KHA_DUNG_VUI_LONG_CHON");
        }

        // Verify service belongs to the same market as the stall (or is global)
        if (service.MarketId.HasValue)
        {
            var stall = await _stallRepository.Query()
                .Include(s => s.Area)
                .FirstOrDefaultAsync(s => s.StallId == request.StallId, ct);
            if (stall != null && stall.Area?.MarketId != service.MarketId.Value)
            {
                throw new BadRequestException("ERR_DICH_VU_NAY_KHONG_DUOC_CUNG_CAP_TAI_CHO_CUA_SAP_BA");
            }
        }

        // A.4.2 Duplicate Service Check & Re-register Logic
        var existingRegistration = (await _serviceRegistrationRepository.FindAsync(
            r => r.VendorId == vendorId && r.StallId == request.StallId && r.ServiceId == request.ServiceId && (r.Status == "Active" || r.Status == "Pending" || r.Status == "PendingCancellation"),
            ct)).FirstOrDefault();

        if (existingRegistration != null)
        {
            if (service.BillingCycle == "One-time")
            {
                throw new BadRequestException("ERR_BAN_DANG_CO_DICH_VU_NAY_DANG_HOAT_DONG_VA_CHUA_HOA");
            }

            if (existingRegistration.IsAutoRenew)
            {
                throw new BadRequestException("ERR_BAN_DA_DANG_KY_DICH_VU_NAY_ROI_VUI_LONG_KIEM_TRA_L");
            }
            else
            {
                // Business Logic: Nếu dịch vụ định kỳ đã bị tắt gia hạn nhưng vẫn còn hạn sử dụng (Status = PendingCancellation)
                // User không được phép đăng ký lại ngay mà phải đợi hết hạn.
                string endDateStr = existingRegistration.EndDate.HasValue 
                    ? existingRegistration.EndDate.Value.ToString("dd/MM/yyyy") 
                    : "cuối kỳ";
                throw new BadRequestException($"ERR_PENDING_CANCELLATION_ERROR_ENDDATESTR|{endDateStr}");
            }
        }

        bool isOneTime = service.BillingCycle == "One-time";

        DateTime? initialEndDate = null;
        if (service.BillingCycle == "Monthly")
            initialEndDate = DateTime.UtcNow.AddMonths(1);
        else if (service.BillingCycle == "Yearly")
            initialEndDate = DateTime.UtcNow.AddYears(1);

        var registration = new ServiceRegistration
        {
            ServiceId = request.ServiceId,
            VendorId = vendorId,
            StallId = request.StallId,
            Status = "Active", // Đăng ký thành công luôn không cần duyệt
            RegisteredAt = DateTime.UtcNow,
            IsAutoRenew = !isOneTime, // Dịch vụ 1 lần không có gia hạn
            EndDate = initialEndDate
        };

        await _serviceRegistrationRepository.AddAsync(registration, ct);
        await _serviceRegistrationRepository.SaveChangesAsync(ct);

        return new ServiceRegistrationDto
        {
            RegistrationId = registration.RegistrationId,
            ServiceId = registration.ServiceId,
            ServiceName = service.Name,
            StallId = registration.StallId,
            Status = registration.Status,
            RegisteredAt = registration.RegisteredAt,
            IsAutoRenew = registration.IsAutoRenew
        };
    }

    public async Task CancelServiceAsync(int vendorId, int registrationId, CancellationToken ct = default)
    {
        if (registrationId <= 0)
        {
            throw new ArgumentException("ERR_ID_DANG_KY_DICH_VU_KHONG_HOP_LE");
        }

        var registration = await _serviceRegistrationRepository.GetByIdAsync(registrationId, ct);
        
        if (registration == null || registration.VendorId != vendorId)
        {
            throw new BadRequestException("ERR_KHONG_TIM_THAY_THONG_TIN_DANG_KY_DICH_VU");
        }

        if (registration.Status == "Cancelled")
        {
            throw new BadRequestException("ERR_DICH_VU_NAY_DA_DUOC_HUY");
        }

        var service = await _serviceRepository.GetByIdAsync(registration.ServiceId, ct);
        if (service != null && (service.Name.Contains("bắt buộc", StringComparison.OrdinalIgnoreCase) || service.Name.Contains("Vệ sinh chung", StringComparison.OrdinalIgnoreCase)))
        {
            throw new BadRequestException("ERR_DAY_LA_DICH_VU_VAN_HANH_BAT_BUOC_CUA_CHO_KHONG_THE");
        }

        if (registration.Status == "Pending")
        {
            registration.Status = "Cancelled";
            registration.CancelledAt = DateTime.UtcNow;
            registration.IsAutoRenew = false;
        }
        else if (registration.Status == "Active" || registration.Status == "PendingCancellation")
        {
            bool isOneTime = service != null && service.BillingCycle == "One-time";

            if (isOneTime)
            {
                // Dịch vụ 1 lần không quản lý theo ngày, hủy là Cancel luôn, để họ có thể đăng ký lại cái mới.
                registration.Status = "Cancelled";
                registration.CancelledAt = DateTime.UtcNow;
                registration.IsAutoRenew = false;
            }
            else
            {
                // Business Logic: Với dịch vụ định kỳ, yêu cầu hủy mang ý nghĩa tắt gia hạn 
                // Đổi trạng thái thành PendingCancellation để dễ nhận biết trên UI, user vẫn dùng được cho đến hết kỳ hiện tại.
                if (registration.Status == "PendingCancellation" || !registration.IsAutoRenew)
                {
                    throw new BadRequestException("ERR_DICH_VU_NAY_DA_DUOC_YEU_CAU_HUY_GIA_HAN_TU_TRUOC");
                }
                registration.Status = "PendingCancellation";
                registration.IsAutoRenew = false;
            }
        }

        _serviceRegistrationRepository.Update(registration);
        await _serviceRegistrationRepository.SaveChangesAsync(ct);
    }

    public async Task ReactivateServiceAsync(int vendorId, int registrationId, CancellationToken ct = default)
    {
        if (registrationId <= 0)
        {
            throw new ArgumentException("ERR_ID_DANG_KY_DICH_VU_KHONG_HOP_LE");
        }

        var registration = await _serviceRegistrationRepository.GetByIdAsync(registrationId, ct);
        
        if (registration == null || registration.VendorId != vendorId)
        {
            throw new BadRequestException("ERR_KHONG_TIM_THAY_THONG_TIN_DANG_KY_DICH_VU");
        }

        if (registration.Status == "Active" && registration.IsAutoRenew)
        {
            throw new BadRequestException("ERR_DICH_VU_NAY_DANG_DUOC_TU_DONG_GIA_HAN");
        }

        if (registration.Status == "PendingCancellation" || (registration.Status == "Active" && !registration.IsAutoRenew))
        {
            registration.Status = "Active";
            registration.IsAutoRenew = true;
            registration.CancelledAt = null;
        }
        else
        {
            throw new BadRequestException("ERR_CHI_CO_THE_KICH_HOAT_LAI_CAC_DICH_VU_DANG_CHO_HUY");
        }

        _serviceRegistrationRepository.Update(registration);
        await _serviceRegistrationRepository.SaveChangesAsync(ct);
    }
}
