using System;

namespace STMM.Business.DTOs.Review
{
    public class ReviewDto
    {
        public int ReviewId { get; set; }
        public int? StallId { get; set; }
        public string? StallCode { get; set; }
        public int? MarketId { get; set; }
        public string? MarketName { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
