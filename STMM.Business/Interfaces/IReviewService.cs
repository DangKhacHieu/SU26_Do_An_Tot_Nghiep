using System.Threading.Tasks;
using STMM.Business.DTOs.Review;

namespace STMM.Business.Interfaces
{
    public interface IReviewService
    {
        Task<ReviewSummaryDto?> GetReviewsByStallAsync(int stallId);
        Task<ReviewDto?> CreateReviewAsync(CreateReviewRequest request);
    }
}
