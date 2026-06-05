using AutoMapper;
using FluentValidation;
using STMM.Business.DTOs.Faq;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.Entities;
using STMM.DataAccess.IRepositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace STMM.Business.Services
{
    public class FaqService : IFaqService
    {
        private readonly IFaqRepository _faqRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateFaqRequest> _createValidator;
        private readonly IValidator<UpdateFaqRequest> _updateValidator;

        public FaqService(
            IFaqRepository faqRepository,
            IUserRepository userRepository,
            IMapper mapper,
            IValidator<CreateFaqRequest> createValidator,
            IValidator<UpdateFaqRequest> updateValidator)
        {
            _faqRepository = faqRepository;
            _userRepository = userRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        public async Task<IEnumerable<FaqDto>> GetFaqsAsync(string? category, bool? isActive, CancellationToken ct = default)
        {
            var faqs = await _faqRepository.GetFaqsAsync(category, isActive, ct);
            return _mapper.Map<IEnumerable<FaqDto>>(faqs);
        }

        public async Task<FaqDto> GetFaqByIdAsync(int id, CancellationToken ct = default)
        {
            var faq = await _faqRepository.GetByIdAsync(id, ct);
            if (faq == null)
            {
                throw new NotFoundException($"Không tìm thấy FAQ có ID {id}.");
            }
            return _mapper.Map<FaqDto>(faq);
        }

        public async Task<FaqDto> CreateFaqAsync(CreateFaqRequest request, CancellationToken ct = default)
        {
            var valResult = await _createValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            // Fallback Creator User ID
            int creatorId = request.CreatedByUserId ?? 0;
            if (creatorId <= 0)
            {
                // Find a Manager or Admin user in db
                var managerUser = await _userRepository.GetFirstManagerOrAdminAsync(ct);
                creatorId = managerUser?.UserId ?? 1;
            }

            var faq = new Faq
            {
                Category = request.Category ?? "General",
                Question = request.Question,
                Answer = request.Answer,
                CreatedByUserId = creatorId,
                IsActive = request.IsActive ?? true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            await _faqRepository.AddAsync(faq, ct);
            await _faqRepository.SaveChangesAsync(ct);

            return _mapper.Map<FaqDto>(faq);
        }

        public async Task<FaqDto> UpdateFaqAsync(int id, UpdateFaqRequest request, CancellationToken ct = default)
        {
            var valResult = await _updateValidator.ValidateAsync(request, ct);
            if (!valResult.IsValid)
            {
                throw new BadRequestException(string.Join("; ", valResult.Errors.Select(e => e.ErrorMessage)));
            }

            var faq = await _faqRepository.GetByIdAsync(id, ct);
            if (faq == null)
            {
                throw new NotFoundException($"Không tìm thấy FAQ có ID {id}.");
            }

            faq.Category = request.Category ?? "General";
            faq.Question = request.Question;
            faq.Answer = request.Answer;
            if (request.IsActive.HasValue)
            {
                faq.IsActive = request.IsActive.Value;
            }
            faq.UpdatedAt = DateTime.UtcNow;

            _faqRepository.Update(faq);
            await _faqRepository.SaveChangesAsync(ct);

            return _mapper.Map<FaqDto>(faq);
        }

        public async Task<bool> DeleteFaqAsync(int id, CancellationToken ct = default)
        {
            var faq = await _faqRepository.GetByIdAsync(id, ct);
            if (faq == null)
            {
                throw new NotFoundException($"Không tìm thấy FAQ có ID {id}.");
            }

            _faqRepository.Delete(faq);
            var result = await _faqRepository.SaveChangesAsync(ct);
            return result > 0;
        }
    }
}
