using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Feedback
{
    /// <summary>
    /// DTO dùng để Vendor gửi câu trả lời cho một đánh giá
    /// </summary>
    public class RespondFeedbackDto
    {
        [Required(ErrorMessage = "Nội dung phản hồi không được để trống.")]
        [StringLength(1000, MinimumLength = 1, ErrorMessage = "Nội dung phản hồi phải từ 1 đến 1000 ký tự.")]
        public string Response { get; set; } = null!;
    }
}
