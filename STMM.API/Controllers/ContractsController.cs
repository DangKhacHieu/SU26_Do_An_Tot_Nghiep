using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Contract;
using STMM.Business.DTOs.Stall;
using STMM.Business.Interfaces;
using STMM.Business.Exceptions;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/manager/contracts")]
    public class ContractsController : ControllerBase
    {
        private readonly IContractService _contractService;

        public ContractsController(IContractService contractService)
        {
            _contractService = contractService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<ContractDto>>> GetContracts(
            [FromQuery] string? search = null,
            [FromQuery] string? status = null,
            CancellationToken ct = default)
        {
            try
            {
                var contracts = await _contractService.GetContractsAsync(search, status, ct);
                return Ok(contracts);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<ContractDto>> GetContractById(int id, CancellationToken ct)
        {
            try
            {
                var contract = await _contractService.GetContractByIdAsync(id, ct);
                if (contract == null)
                {
                    return NotFound(new { message = $"Không tìm thấy hợp đồng có ID {id}." });
                }
                return Ok(contract);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<ActionResult<ContractDto>> CreateContract([FromBody] CreateContractRequest request, CancellationToken ct)
        {
            try
            {
                var created = await _contractService.CreateContractAsync(request, ct);
                return CreatedAtAction(nameof(GetContractById), new { id = created.ContractId }, created);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}/renew")]
        public async Task<ActionResult<ContractDto>> RenewContract(int id, [FromBody] RenewContractRequest request, CancellationToken ct)
        {
            try
            {
                var renewed = await _contractService.RenewContractAsync(id, request, ct);
                return Ok(renewed);
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}/terminate")]
        public async Task<ActionResult<ContractDto>> TerminateContract(int id, CancellationToken ct)
        {
            try
            {
                var terminated = await _contractService.TerminateContractAsync(id, ct);
                return Ok(terminated);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("vendors")]
        public async Task<ActionResult<IEnumerable<ContractVendorDto>>> GetContractVendors(CancellationToken ct)
        {
            try
            {
                var vendors = await _contractService.GetContractVendorsAsync(ct);
                return Ok(vendors);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpGet("available-stalls")]
        public async Task<ActionResult<IEnumerable<StallDto>>> GetAvailableStalls(CancellationToken ct)
        {
            try
            {
                var stalls = await _contractService.GetAvailableStallsAsync(ct);
                return Ok(stalls);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPut("{id}/vendor-info")]
        public async Task<ActionResult<ContractDto>> UpdateVendorInfo(int id, [FromBody] UpdateContractVendorInfoRequest request, CancellationToken ct)
        {
            try
            {
                var updated = await _contractService.UpdateContractVendorInfoAsync(id, request, ct);
                return Ok(updated);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }

        [HttpPost("{id}/files")]
        public async Task<ActionResult<ContractDto>> AttachFiles(int id, [FromBody] AttachContractFilesRequest request, CancellationToken ct)
        {
            try
            {
                var updated = await _contractService.AttachSignedFilesAsync(id, request, ct);
                return Ok(updated);
            }
            catch (NotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = ex.Message });
            }
        }
    }
}
