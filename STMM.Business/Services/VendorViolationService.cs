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

        public async Task<PagedResult<ViolationDto>> GetMyViolationsAsync(int vendorId, ViolationQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _violationRepository.GetViolationsForVendorPagedAsync(
                vendorId,
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
            var violation = await _violationRepository.GetViolationDetailForVendorAsync(violationId, vendorId, ct);
            if (violation == null)
            {
                return null;
            }

            return _mapper.Map<ViolationDto>(violation);
        }
    }
}
