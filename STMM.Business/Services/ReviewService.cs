using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using STMM.Business.DTOs.Review;
using STMM.Business.Interfaces;
using STMM.DataAccess.IRepositories;
using STMM.DataAccess.Entities;

namespace STMM.Business.Services
{
    public class ReviewService : IReviewService
    {
        private readonly IReviewRepository _reviewRepository;
        private readonly IStallRepository _stallRepository;
        private readonly IMarketRepository _marketRepository;
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;

        public ReviewService(
            IReviewRepository reviewRepository,
            IStallRepository stallRepository,
            IMarketRepository marketRepository,
            IUserRepository userRepository,
            IMapper mapper)
        {
            _reviewRepository = reviewRepository;
            _stallRepository = stallRepository;
            _marketRepository = marketRepository;
            _userRepository = userRepository;
            _mapper = mapper;
        }

        public async Task<ReviewSummaryDto?> GetReviewsByStallAsync(int stallId)
        {
            if (stallId <= 0)
            {
                throw new ArgumentException("ID sạp hàng không hợp lệ.");
            }

            var stallExists = await _stallRepository.Query()
                .AnyAsync(s => s.StallId == stallId && s.IsDeleted != true);

            if (!stallExists) return null;

            var reviews = await _reviewRepository.Query()
                .Include(r => r.User)
                .Where(r => r.StallId == stallId)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            double averageRating = 0;
            if (reviews.Any())
            {
                averageRating = Math.Round(reviews.Average(r => r.Rating), 1);
            }

            var reviewDtos = _mapper.Map<List<ReviewDto>>(reviews);

            return new ReviewSummaryDto
            {
                StallId = stallId,
                AverageRating = averageRating,
                TotalReviews = reviews.Count,
                Reviews = reviewDtos
            };
        }

        public async Task<ReviewSummaryDto?> GetReviewsByMarketAsync(int marketId)
        {
            if (marketId <= 0)
            {
                throw new ArgumentException("ID chợ không hợp lệ.");
            }

            var marketExists = await _marketRepository.Query()
                .AnyAsync(m => m.MarketId == marketId && m.IsDeleted != true);

            if (!marketExists) return null;

            var reviews = await _reviewRepository.Query()
                .Include(r => r.User)
                .Where(r => r.MarketId == marketId && r.StallId == null)
                .OrderByDescending(r => r.CreatedAt)
                .ToListAsync();

            double averageRating = 0;
            if (reviews.Any())
            {
                averageRating = Math.Round(reviews.Average(r => r.Rating), 1);
            }

            var reviewDtos = _mapper.Map<List<ReviewDto>>(reviews);

            return new ReviewSummaryDto
            {
                MarketId = marketId,
                AverageRating = averageRating,
                TotalReviews = reviews.Count,
                Reviews = reviewDtos
            };
        }

        public async Task<ReviewDto?> CreateReviewAsync(CreateReviewRequest request)
        {
            if (request == null) return null;

            if ((!request.StallId.HasValue || request.StallId.Value <= 0) && (!request.MarketId.HasValue || request.MarketId.Value <= 0))
            {
                throw new ArgumentException("Vui lòng cung cấp ID sạp hàng hoặc ID chợ cần đánh giá.");
            }

            if (request.StallId.HasValue && request.StallId.Value > 0)
            {
                var stallExists = await _stallRepository.Query()
                    .AnyAsync(s => s.StallId == request.StallId.Value && s.IsDeleted != true);
                if (!stallExists)
                {
                    throw new ArgumentException("Không tìm thấy sạp hàng cần đánh giá.");
                }
            }

            if (request.MarketId.HasValue && request.MarketId.Value > 0)
            {
                var marketExists = await _marketRepository.Query()
                    .AnyAsync(m => m.MarketId == request.MarketId.Value && m.IsDeleted != true);
                if (!marketExists)
                {
                    throw new ArgumentException("Không tìm thấy chợ cần đánh giá.");
                }
            }

            var userExists = await _userRepository.Query()
                .AnyAsync(u => u.UserId == request.UserId && u.IsDeleted != true);
            if (!userExists)
            {
                throw new ArgumentException("Tài khoản người dùng không hợp lệ.");
            }

            var review = _mapper.Map<Review>(request);
            if (request.StallId.HasValue && request.StallId.Value <= 0) review.StallId = null;
            if (request.MarketId.HasValue && request.MarketId.Value <= 0) review.MarketId = null;
            review.CreatedAt = DateTime.UtcNow;

            await _reviewRepository.AddAsync(review);
            await _reviewRepository.SaveChangesAsync();

            // Fetch newly created review details with user name and stall/market
            var createdReview = await _reviewRepository.Query()
                .Include(r => r.User)
                .Include(r => r.Stall)
                .Include(r => r.Market)
                .FirstOrDefaultAsync(r => r.ReviewId == review.ReviewId);

            return _mapper.Map<ReviewDto>(createdReview);
        }

        public async Task<ReviewDto?> UpdateReviewAsync(int reviewId, UpdateReviewRequest request)
        {
            if (request == null) return null;

            var review = await _reviewRepository.Query()
                .Include(r => r.User)
                .FirstOrDefaultAsync(r => r.ReviewId == reviewId);

            if (review == null)
            {
                throw new ArgumentException("Không tìm thấy đánh giá.");
            }

            if (review.UserId != request.UserId)
            {
                throw new ArgumentException("Bạn không có quyền chỉnh sửa đánh giá này.");
            }

            review.Rating = request.Rating;
            review.Comment = request.Comment;

            _reviewRepository.Update(review);
            await _reviewRepository.SaveChangesAsync();

            return _mapper.Map<ReviewDto>(review);
        }

        public async Task<List<ReviewDto>> GetRecentReviewsAsync(int limit)
        {
            var reviews = await _reviewRepository.Query()
                .Include(r => r.User)
                .Include(r => r.Stall)
                .Include(r => r.Market)
                .OrderByDescending(r => r.CreatedAt)
                .Take(limit)
                .ToListAsync();

            return _mapper.Map<List<ReviewDto>>(reviews);
        }
    }
}
