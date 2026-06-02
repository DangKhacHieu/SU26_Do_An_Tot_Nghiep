namespace STMM.Business.DTOs.Issue
{
    public class CreateIssueRequest
    {
        /// <summary>
        /// Sạp/khu vực nơi phát hiện sự cố (DB NOT NULL — Staff chọn sạp gần nhất)
        /// </summary>
        public int StallId { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// URL ảnh sự cố (optional — upload Cloudinary trước, gửi URL)
        /// </summary>
        public string? ImageUrl { get; set; }
    }
}
