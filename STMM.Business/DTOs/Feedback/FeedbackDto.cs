using System;

namespace STMM.Business.DTOs.Feedback
{
    /// <summary>
    /// DTO trả về thông tin một đánh giá (Review) kèm phản hồi của Vendor
    /// </summary>
    public class FeedbackDto
    {
        public int FeedbackId { get; set; }       // Tương ứng ReviewId
        public string? Content { get; set; }       // Tương ứng Comment - nội dung đánh giá của khách
        public string? Response { get; set; }      // Nội dung phản hồi của Vendor
        public string Status { get; set; } = "Pending";
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }

        // Thông tin bổ sung
        public int? StallId { get; set; }
        public string? StallCode { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public int Rating { get; set; }
    }
}
