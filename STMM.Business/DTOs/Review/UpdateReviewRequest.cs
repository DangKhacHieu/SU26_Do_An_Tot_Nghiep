namespace STMM.Business.DTOs.Review
{
    public class UpdateReviewRequest
    {
        public int UserId { get; set; }
        public int Rating { get; set; }
        public string? Comment { get; set; }
    }
}
