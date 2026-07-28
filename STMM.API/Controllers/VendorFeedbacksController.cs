using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using STMM.Business.DTOs.Feedback;
using STMM.Business.Exceptions;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace STMM.API.Controllers
{
    /// <summary>
    /// Controller dành riêng cho Vendor để xem và trả lời các đánh giá sạp của mình
    /// </summary>
    [Route("api/vendor/feedbacks")]
    [ApiController]
    [Authorize(Roles = "Vendor")]
    public class VendorFeedbacksController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;
        private readonly IVendorRepository _vendorRepository;

        public VendorFeedbacksController(
            IFeedbackService feedbackService,
            IVendorRepository vendorRepository)
        {
            _feedbackService = feedbackService;
            _vendorRepository = vendorRepository;
        }

        /// <summary>
        /// Lấy VendorId từ JWT token của người dùng đang đăng nhập
        /// </summary>
        private async Task<int> GetVendorIdAsync()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdStr) || !int.TryParse(userIdStr, out int userId))
            {
                throw new System.UnauthorizedAccessException("Không tìm thấy thông tin người dùng trong token.");
            }

            var vendors = await _vendorRepository.FindAsync(v => v.UserId == userId);
            var vendor = vendors.FirstOrDefault();
            if (vendor == null)
            {
                throw new System.UnauthorizedAccessException("Không tìm thấy hồ sơ Vendor của người dùng này.");
            }

            return vendor.VendorId;
        }

        /// <summary>
        /// GET api/vendor/feedbacks
        /// Lấy tất cả đánh giá của các sạp mà Vendor đang quản lý
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAllFeedbacks()
        {
            try
            {
                int vendorId = await GetVendorIdAsync();
                var result = await _feedbackService.GetAllFeedbacksAsync(vendorId);
                return Ok(result);
            }
            catch (System.UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }

        /// <summary>
        /// POST api/vendor/feedbacks/{id}/respond
        /// Vendor trả lời một đánh giá (chỉ được phép trả lời 1 lần)
        /// </summary>
        [HttpPost("{id}/respond")]
        public async Task<IActionResult> RespondToFeedback(int id, [FromBody] RespondFeedbackDto responseDto)
        {
            // ─── VALIDATION TẠI CONTROLLER ──────────────────────────────────────────
            // (Bước 4 trong SD) - Kiểm tra đầu vào cơ bản
            if (responseDto == null || string.IsNullOrWhiteSpace(responseDto.Response))
            {
                return BadRequest(new { message = "Nội dung phản hồi không được để trống." });
            }

            try
            {
                int vendorId = await GetVendorIdAsync();

                // Gọi xuống Service để xử lý toàn bộ business logic và validation
                var result = await _feedbackService.RespondToFeedbackAsync(id, responseDto, vendorId);

                // (Bước 37 trong SD) - Trả về HTTP 200 OK kèm FeedbackDto
                return Ok(result);
            }
            catch (BadRequestException ex)
            {
                // (Bước 8 trong SD) - HTTP 400 Bad Request
                return BadRequest(new { message = ex.Message });
            }
            catch (NotFoundException ex)
            {
                // (Bước 14 trong SD) - HTTP 404 Not Found
                return NotFound(new { message = ex.Message });
            }
            catch (ForbiddenException ex)
            {
                // (Bước 22 trong SD) - HTTP 400 khi vendor không sở hữu sạp
                return BadRequest(new { message = ex.Message });
            }
            catch (System.UnauthorizedAccessException ex)
            {
                return Unauthorized(new { message = ex.Message });
            }
        }
    }
}
