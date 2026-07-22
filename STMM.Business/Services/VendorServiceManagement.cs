using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Service;
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

    public VendorServiceManagement(
        IServiceRepository serviceRepository,
        IServiceRegistrationRepository serviceRegistrationRepository,
        IInvoiceRepository invoiceRepository,
        IContractRepository contractRepository,
        IStallRepository stallRepository)
    {
        _serviceRepository = serviceRepository;
        _serviceRegistrationRepository = serviceRegistrationRepository;
        _invoiceRepository = invoiceRepository;
        _contractRepository = contractRepository;
        _stallRepository = stallRepository;
    }

    public async Task<IEnumerable<ServiceDto>> GetAvailableServicesAsync(int vendorId, CancellationToken ct = default)
    {
        // Get all active services
        var services = await _serviceRepository.FindAsync(s => s.IsActive == true, ct);
        
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
            throw new ArgumentException("ID đăng ký dịch vụ không hợp lệ.");

        var registration = await _serviceRegistrationRepository.GetRegistrationWithRelationsAsync(registrationId);
        
        if (registration == null)
            throw new KeyNotFoundException("Không tìm thấy thông tin đăng ký dịch vụ.");
            
        if (registration.VendorId != vendorId)
            throw new UnauthorizedAccessException("Bạn không có quyền truy cập thông tin dịch vụ này.");

        if (registration.Service == null || registration.Service.IsActive != true)
            throw new InvalidOperationException("Dịch vụ này đã bị hệ thống ngừng cung cấp hoặc xóa bỏ.");

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

    public async Task<IEnumerable<STMM.Business.DTOs.Stall.StallDto>> GetMyStallsAsync(int vendorId, CancellationToken ct = default)
    {
        var vendorContracts = await _contractRepository.Query()
            .Include(c => c.Stall)
            .Where(c => c.VendorId == vendorId && (c.Status == "Active" || c.Status == "Pending" || c.Status == "PendingApproval"))
            .ToListAsync(ct);

        var stalls = vendorContracts.Select(c => c.Stall).Where(s => s != null).DistinctBy(s => s.StallId);
        
        return stalls.Select(s => new STMM.Business.DTOs.Stall.StallDto
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
            throw new ArgumentException("Thông tin ID Sạp hoặc ID Dịch vụ không hợp lệ.");
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
            throw new BadRequestException("Bạn có hóa đơn quá hạn chưa thanh toán. Vui lòng hoàn tất công nợ trước khi đăng ký dịch vụ mới.");
        }

        // Verify stall belongs to vendor
        var stallIsRentedByVendor = vendorContracts.Any(c => c.StallId == request.StallId);
        if (!stallIsRentedByVendor)
        {
            throw new BadRequestException("Bạn không có quyền đăng ký dịch vụ cho sạp này.");
        }

        // Check if service exists
        var service = await _serviceRepository.GetByIdAsync(request.ServiceId, ct);
        if (service == null || service.IsActive != true)
        {
            throw new BadRequestException("Dịch vụ này hiện không còn khả dụng. Vui lòng chọn dịch vụ khác.");
        }

        // A.4.2 Duplicate Service Check
        var existingRegistration = (await _serviceRegistrationRepository.FindAsync(
            r => r.VendorId == vendorId && r.StallId == request.StallId && r.ServiceId == request.ServiceId && (r.Status == "Active" || r.Status == "Pending"),
            ct)).FirstOrDefault();

        if (existingRegistration != null)
        {
            throw new BadRequestException("Bạn đã đăng ký dịch vụ này rồi. Vui lòng kiểm tra lại trong phần Dịch vụ của tôi.");
        }

        // Register as Pending
        var registration = new ServiceRegistration
        {
            ServiceId = request.ServiceId,
            VendorId = vendorId,
            StallId = request.StallId,
            Status = "Pending",
            RegisteredAt = DateTime.UtcNow,
            IsAutoRenew = true // default to true until approved
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
            throw new ArgumentException("ID đăng ký dịch vụ không hợp lệ.");
        }

        var registration = await _serviceRegistrationRepository.GetByIdAsync(registrationId, ct);
        
        if (registration == null || registration.VendorId != vendorId)
        {
            throw new BadRequestException("Không tìm thấy thông tin đăng ký dịch vụ.");
        }

        if (registration.Status == "Cancelled")
        {
            throw new BadRequestException("Dịch vụ này đã được hủy.");
        }

        // Prevent canceling mandatory services
        // Assuming "Basic Garbage Collection" might have FeeTypeId = 1 or something, but we check name/description for now.
        // Or we could add IsMandatory to Service. For now, let's assume it checks name.
        var service = await _serviceRepository.GetByIdAsync(registration.ServiceId, ct);
        if (service != null && (service.Name.Contains("bắt buộc", StringComparison.OrdinalIgnoreCase) || service.Name.Contains("Vệ sinh chung", StringComparison.OrdinalIgnoreCase)))
        {
            throw new BadRequestException("Đây là dịch vụ vận hành bắt buộc của chợ, không thể tự ý hủy. Vui lòng liên hệ Ban quản lý nếu có thắc mắc.");
        }

        if (registration.Status == "Pending")
        {
            // A.3.1 Cancel a Pending Request
            registration.Status = "Cancelled";
            registration.CancelledAt = DateTime.UtcNow;
        }
        else if (registration.Status == "Active")
        {
            // A.Cancel an Active Subscription
            registration.IsAutoRenew = false;
        }

        _serviceRegistrationRepository.Update(registration);
        await _serviceRegistrationRepository.SaveChangesAsync(ct);
    }
}
