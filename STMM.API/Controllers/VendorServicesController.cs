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
using STMM.Business.Exceptions;
using STMM.DataAccess.Data;

using STMM.DataAccess.IRepositories;

namespace STMM.API.Controllers;

[ApiController]
[Route("api/vendor/services")]
[Authorize(Roles = "Vendor")]
public class VendorServicesController : ControllerBase
{
    private readonly IVendorServiceManagement _vendorServiceManagement;

    public VendorServicesController(IVendorServiceManagement vendorServiceManagement)
    {
        _vendorServiceManagement = vendorServiceManagement;
    }

    private async Task<int> GetVendorIdAsync(CancellationToken ct)
    {
        var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdStr, out var userId))
        {
            return await _vendorServiceManagement.GetVendorIdByUserIdAsync(userId, ct);
        }
        throw new UnauthorizedAccessException("Không xác định được danh tính người bán.");
    }

    [HttpGet("available")]
    public async Task<IActionResult> GetAvailableServices(CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            var services = await _vendorServiceManagement.GetAvailableServicesAsync(vendorId, ct);
            return Ok(services);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("my-services")]
    public async Task<IActionResult> GetMyServices(CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            var myServices = await _vendorServiceManagement.GetMyServicesAsync(vendorId, ct);
            return Ok(myServices);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetServiceDetail(int id, CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            var serviceDetail = await _vendorServiceManagement.GetServiceDetailAsync(vendorId, id, ct);
            return Ok(serviceDetail);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-stalls")]
    public async Task<IActionResult> GetMyStalls(CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            var stalls = await _vendorServiceManagement.GetMyStallsAsync(vendorId, ct);
            return Ok(stalls);
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    [HttpPost("register")]
    public async Task<IActionResult> RegisterService([FromBody] RegisterServiceRequest request, CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            var result = await _vendorServiceManagement.RegisterServiceAsync(vendorId, request, ct);
            return Ok(new { message = "Đăng ký dịch vụ thành công.", data = result });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (BadRequestException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelService(int id, CancellationToken ct)
    {
        try
        {
            var vendorId = await GetVendorIdAsync(ct);
            await _vendorServiceManagement.CancelServiceAsync(vendorId, id, ct);
            return Ok(new { message = "Yêu cầu hủy dịch vụ đã được ghi nhận thành công." });
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (BadRequestException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
