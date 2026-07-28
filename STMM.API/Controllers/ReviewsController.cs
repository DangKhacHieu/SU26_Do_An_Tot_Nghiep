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
            try
            {
                var summary = await _reviewService.GetReviewsByStallAsync(stallId);
                if (summary == null)
                {
                    return NotFound("Không tìm thấy thông tin sạp hàng.");
                }

                return Ok(summary);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Get reviews and rating summary for a specific market.
        /// Both guests and logged-in customers can view this.
        /// </summary>
        [HttpGet("market/{marketId}")]
        public async Task<IActionResult> GetReviewsByMarket(int marketId)
        {
            try
            {
                var summary = await _reviewService.GetReviewsByMarketAsync(marketId);
                if (summary == null)
                {
                    return NotFound("Không tìm thấy thông tin chợ.");
                }

                return Ok(summary);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// Post a new review for a stall or market.
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

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Update an existing review.
        /// </summary>
        [HttpPut("{reviewId}")]
        public async Task<IActionResult> UpdateReview(int reviewId, [FromBody] UpdateReviewRequest request)
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
                var result = await _reviewService.UpdateReviewAsync(reviewId, request);
                if (result == null)
                {
                    return BadRequest("Không thể cập nhật đánh giá.");
                }

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        /// <summary>
        /// Get recent reviews from the database across all stalls.
        /// </summary>
        [HttpGet("recent")]
        public async Task<IActionResult> GetRecentReviews([FromQuery] int limit = 6)
        {
            var reviews = await _reviewService.GetRecentReviewsAsync(limit);
            return Ok(reviews);
        }
    }
}
