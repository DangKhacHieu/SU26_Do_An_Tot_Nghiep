using System.Threading.Tasks;
using STMM.Business.DTOs.Feedback;

namespace STMM.Business.Interfaces
{
    public interface IFeedbackService
    {
        /// <summary>
        /// Lấy danh sách tất cả các đánh giá của sạp mà Vendor đang quản lý
        /// </summary>
        Task<System.Collections.Generic.IEnumerable<FeedbackDto>> GetAllFeedbacksAsync(int vendorId);

        /// <summary>
        /// Vendor trả lời lại một đánh giá (chỉ được trả lời 1 lần)
        /// </summary>
        Task<FeedbackDto> RespondToFeedbackAsync(int reviewId, RespondFeedbackDto responseDto, int vendorId);

        Task<int> GetVendorIdByUserIdAsync(int userId);
    }
}
