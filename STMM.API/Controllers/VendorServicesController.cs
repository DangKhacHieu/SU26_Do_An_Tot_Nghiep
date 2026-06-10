using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Service;
using STMM.Business.Interfaces;
using STMM.DataAccess.Data;

namespace STMM.API.Controllers;

[ApiController]
[Route("api/vendor/services")]
[Authorize(Roles = "Vendor")]
public class VendorServicesController : ControllerBase
{
    private readonly IVendorServiceManagement _vendorServiceManagement;
    private readonly AppDbContext _context;

    public VendorServicesController(IVendorServiceManagement vendorServiceManagement, AppDbContext context)
    {
        _vendorServiceManagement = vendorServiceManagement;
        _context = context;
    }

    private int GetVendorId()
    {
        var vendorIdStr = User.FindFirstValue("VendorId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(vendorIdStr, out var vendorId))
        {
            return vendorId;
        }
        throw new UnauthorizedAccessException("Không xác định được danh tính người bán.");
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableServices(CancellationToken ct)
    {
        var vendorId = GetVendorId();
        var services = await _vendorServiceManagement.GetAvailableServicesAsync(vendorId, ct);
        return Ok(services);
    }

    [HttpGet("my-services")]
    public async Task<IActionResult> GetMyServices(CancellationToken ct)
    {
        var vendorId = GetVendorId();
        var myServices = await _vendorServiceManagement.GetMyServicesAsync(vendorId, ct);
        return Ok(myServices);
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterService([FromBody] RegisterServiceRequest request, CancellationToken ct)
    {
        var vendorId = GetVendorId();
        var result = await _vendorServiceManagement.RegisterServiceAsync(vendorId, request, ct);
        return Ok(new { message = "Đăng ký thành công. Vui lòng đợi Ban quản lý phê duyệt để kích hoạt dịch vụ.", data = result });
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelService(int id, CancellationToken ct)
    {
        var vendorId = GetVendorId();
        await _vendorServiceManagement.CancelServiceAsync(vendorId, id, ct);
        return Ok(new { message = "Yêu cầu hủy dịch vụ đã được ghi nhận thành công." });
    }
}
