using AutoMapper;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Violation;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class VendorViolationService : IVendorViolationService
    {
        private readonly IViolationRepository _violationRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IMapper _mapper;

        public VendorViolationService(
            IViolationRepository violationRepository,
            IContractRepository contractRepository,
            IMapper mapper)
        {
            _violationRepository = violationRepository;
            _contractRepository = contractRepository;
            _mapper = mapper;
        }

        private async Task<List<int>> GetVendorStallIdsAsync(int vendorId, CancellationToken ct)
        {
            var contracts = await _contractRepository.FindAsync(c => c.VendorId == vendorId && c.IsDeleted != true && c.Status != "Terminated" && c.Status != "Expired", ct);
            return contracts.Select(c => c.StallId).Distinct().ToList();
        }

        public async Task<PagedResult<ViolationDto>> GetMyViolationsAsync(int vendorId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var stallIds = await GetVendorStallIdsAsync(vendorId, ct);
            if (!stallIds.Any())
            {
                return new PagedResult<ViolationDto>
                {
                    Items = new List<ViolationDto>(),
                    TotalCount = 0,
                    PageNumber = queryParams.PageNumber,
                    PageSize = queryParams.PageSize
                };
            }

            var (items, totalCount) = await _violationRepository.GetViolationsForVendorPagedAsync(
                stallIds,
                queryParams.Status,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            var dtos = _mapper.Map<IEnumerable<ViolationDto>>(items);

            return new PagedResult<ViolationDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<ViolationDto?> GetViolationDetailAsync(int vendorId, int violationId, CancellationToken ct = default)
        {
            var stallIds = await GetVendorStallIdsAsync(vendorId, ct);
            if (!stallIds.Any())
            {
                return null;
            }

            var violation = await _violationRepository.GetViolationDetailForVendorAsync(violationId, stallIds, ct);
            if (violation == null)
            {
                return null;
            }

            return _mapper.Map<ViolationDto>(violation);
        }
    }
}
