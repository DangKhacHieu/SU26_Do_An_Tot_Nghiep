using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using STMM.Business.Interfaces;
using STMM.Business.DTOs.Review;

namespace STMM.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        /// <summary>
        /// Get reviews and rating summary for a specific stall.
        /// Both guests and logged-in customers can view this.
        /// </summary>
        [HttpGet("stall/{stallId}")]
        public async Task<IActionResult> GetReviewsByStall(int stallId)
        {
            var summary = await _reviewService.GetReviewsByStallAsync(stallId);
            if (summary == null)
            {
                return NotFound("Không tìm thấy thông tin sạp hàng.");
            }

            return Ok(summary);
        }

        /// <summary>
        /// Post a new review for a stall.
        /// Required for logged-in customers.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
        {
            if (request == null)
            {
                return BadRequest("Dữ liệu đánh giá không hợp lệ.");
            }

            if (request.Rating < 1 || request.Rating > 5)
            {
                return BadRequest("Điểm đánh giá phải từ 1 đến 5 sao.");
            }

            try
            {
                var result = await _reviewService.CreateReviewAsync(request);
                if (result == null)
                {
                    return BadRequest("Không thể gửi đánh giá.");
                }

                return CreatedAtAction(nameof(GetReviewsByStall), new { stallId = result.StallId }, result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
