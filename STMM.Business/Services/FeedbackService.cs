using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Feedback;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Services
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IFeedbackRepository _feedbackRepository;
        private readonly IContractRepository _contractRepository;
        private readonly IVendorRepository _vendorRepository;
        private readonly IMapper _mapper;

        public FeedbackService(
            IFeedbackRepository feedbackRepository,
            IContractRepository contractRepository,
            IVendorRepository vendorRepository,
            IMapper mapper)
        {
            _feedbackRepository = feedbackRepository;
            _contractRepository = contractRepository;
            _vendorRepository = vendorRepository;
            _mapper = mapper;
        }

        /// <summary>
        /// Lấy danh sách tất cả đánh giá của các sạp mà Vendor đang quản lý
        /// </summary>
        public async Task<IEnumerable<FeedbackDto>> GetAllFeedbacksAsync(int vendorId)
        {
            // Lấy danh sách contract Active của vendor để biết vendor đang quản lý sạp nào
            var activeContracts = await _contractRepository.Query()
                .Where(c => c.VendorId == vendorId && c.Status == "Active" && c.IsDeleted != true)
                .Select(c => c.StallId)
                .ToListAsync();

            if (!activeContracts.Any())
            {
                return new List<FeedbackDto>();
            }

            // Lấy tất cả reviews của các sạp đó
            var reviews = await _feedbackRepository.Query()
                .Include(r => r.User)
                .Include(r => r.Stall)
                .Where(r => r.StallId != null && activeContracts.Contains(r.StallId.Value))
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            return _mapper.Map<IEnumerable<FeedbackDto>>(reviews);
        }

        /// <summary>
        /// Vendor trả lời lại đánh giá. Tuân theo các bước Validation trong Sequence Diagram.
        /// </summary>
        public async Task<FeedbackDto> RespondToFeedbackAsync(int reviewId, RespondFeedbackDto responseDto, int vendorId)
        {
            // ─── VALIDATION 1: Validate đầu vào ───────────────────────────────────────
            // (Bước 4 trong SD) - id và response không được rỗng
            if (reviewId <= 0)
            {
                throw new BadRequestException("ERR_ID_DANH_GIA_KHONG_HOP_LE");
            }

            if (responseDto == null || string.IsNullOrWhiteSpace(responseDto.Response))
            {
                throw new BadRequestException("ERR_NOI_DUNG_PHAN_HOI_KHONG_DUOC_DE_TRONG");
            }

            // ─── VALIDATION 2: Kiểm tra đánh giá có tồn tại không ───────────────────
            // (Bước 12 trong SD) - SELECT * FROM reviews WHERE id = reviewId
            var review = await _feedbackRepository.Query()
                .Include(r => r.User)
                .Include(r => r.Stall)
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

            if (review == null)
            {
                throw new NotFoundException("ERR_KHONG_TIM_THAY_DANH_GIA");
            }

            // ─── VALIDATION 3: Kiểm tra Vendor có quyền sở hữu Stall bị đánh giá ───
            // (Bước 20 trong SD) - CheckVendorOwnsStall: SELECT EXISTS contract WHERE stallId AND vendorId
            if (review.StallId == null)
            {
                throw new BadRequestException("ERR_DANH_GIA_NAY_KHONG_THUOC_VE_SAP_NAO");
            }

            var ownsStall = await _contractRepository.Query()
                .AnyAsync(c => c.VendorId == vendorId
                            && c.StallId == review.StallId.Value
                            && c.Status == "Active"
                            && c.IsDeleted != true);

            if (!ownsStall)
            {
                throw new ForbiddenException("ERR_BAN_KHONG_CO_QUYEN_TRA_LOI_DANH_GIA_NAY_VI_SAP_KHO");
            }

            // ─── VALIDATION 4: Kiểm tra đã trả lời chưa (Chỉ được trả lời 1 lần) ───
            // (Bước 24 trong SD) - Verify feedback status
            if (review.Status == "Responded" || !string.IsNullOrEmpty(review.Response))
            {
                throw new BadRequestException("ERR_BAN_DA_TRA_LOI_DANH_GIA_NAY_ROI_MOI_DANH_GIA_CHI_D");
            }

            // ─── XỬ LÝ THÀNH CÔNG: Cập nhật phản hồi ────────────────────────────────
            // (Bước 28 trong SD) - Update review (ResponseText, RespondedAt, Status)
            review.Response = responseDto.Response.Trim();
            review.Status = "Responded";
            review.RespondedAt = DateTime.UtcNow;

            _feedbackRepository.Update(review);
            await _feedbackRepository.SaveChangesAsync();

            return _mapper.Map<FeedbackDto>(review);
        }

        public async Task<int> GetVendorIdByUserIdAsync(int userId)
        {
            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId);
            var vendor = vendors.FirstOrDefault();
            if (vendor == null)
            {
                throw new System.UnauthorizedAccessException("Không tìm thấy hồ sơ Vendor của người dùng này.");
            }

            return vendor.VendorId;
        }
    }
}
