using System.Threading.Tasks;
using STMM.Business.DTOs.Review;

namespace STMM.Business.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewSummaryDto?> GetReviewsByStallAsync(int stallId);
        Task<ReviewDto?> CreateReviewAsync(CreateReviewRequest request);
        Task<ReviewDto?> UpdateReviewAsync(int reviewId, UpdateReviewRequest request);
        Task<System.Collections.Generic.List<ReviewDto>> GetRecentReviewsAsync(int limit);
    }
}
