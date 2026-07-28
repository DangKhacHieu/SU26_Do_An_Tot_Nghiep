namespace STMM.Business.DTOs.Review
{
    public class CreateReviewRequest
    {
        public int? StallId { get; set; }
        public int? MarketId { get; set; }
        public int UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
