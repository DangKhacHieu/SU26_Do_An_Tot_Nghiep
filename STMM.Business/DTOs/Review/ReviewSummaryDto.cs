using System.Collections.Generic;

namespace STMM.Business.DTOs.Review
{
    public class ReviewSummaryDto
    {
        public int StallId { get; set; }
        public double AverageRating { get; set; }
        public int TotalReviews { get; set; }
        public List<ReviewDto> Reviews { get; set; } = new List<ReviewDto>();
    }
}
