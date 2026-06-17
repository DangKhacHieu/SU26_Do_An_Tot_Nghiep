using AutoMapper;
using STMM.Business.DTOs.Common;
using STMM.Business.DTOs.Request;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class RequestService : IRequestService
    {
        private readonly IRequestRepository _requestRepository;
        private readonly IMapper _mapper;

        public RequestService(IRequestRepository requestRepository, IMapper mapper)
        {
            _requestRepository = requestRepository;
            _mapper = mapper;
        }

        public async Task<PagedResult<RequestDto>> GetRequestsForManagerAsync(RequestQueryParams queryParams, CancellationToken ct = default)
        {
            var (items, totalCount) = await _requestRepository.GetRequestsPagedAsync(
                null, // vendorId
                queryParams.Status,
                queryParams.RequestType,
                queryParams.SearchTerm,
                queryParams.SortDescending,
                queryParams.PageNumber,
                queryParams.PageSize,
                ct);

            var dtos = _mapper.Map<IEnumerable<RequestDto>>(items);

            return new PagedResult<RequestDto>
            {
                Items = dtos,
                TotalCount = totalCount,
                PageNumber = queryParams.PageNumber,
                PageSize = queryParams.PageSize
            };
        }

        public async Task<RequestDto> GetRequestByIdForManagerAsync(int id, CancellationToken ct = default)
        {
            var request = await _requestRepository.GetRequestWithRelationsAsync(id, ct);

            if (request == null)
            {
                throw new NotFoundException($"Yêu cầu với mã {id} không tìm thấy.");
            }

            return _mapper.Map<RequestDto>(request);
        }

        public async Task<RequestDto> ResolveViolationAppealAsync(int requestId, bool approve, CancellationToken ct = default)
        {
            var request = await _requestRepository.ApproveOrRejectAppealAsync(requestId, approve, ct);

            if (request == null)
            {
                throw new NotFoundException($"Violation appeal request with ID {requestId} was not found or is not a ViolationAppeal.");
            }

            var requestWithRelations = await _requestRepository.GetRequestWithRelationsAsync(requestId, ct);
            return _mapper.Map<RequestDto>(requestWithRelations!);
        }
    }
}
