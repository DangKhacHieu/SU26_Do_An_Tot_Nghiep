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
        /// Danh sách ảnh sự cố đính kèm (tối đa 3 ảnh)
        /// </summary>
        public List<Microsoft.AspNetCore.Http.IFormFile>? Images { get; set; }
    }
}
