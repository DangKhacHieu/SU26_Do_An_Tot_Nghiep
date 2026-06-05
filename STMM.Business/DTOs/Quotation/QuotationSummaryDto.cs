using System.Collections.Generic;

namespace STMM.Business.DTOs.Quotation
{
    /// <summary>
    /// Tóm tắt báo giá vật tư của một task sửa chữa:
    /// danh sách dòng vật tư và tổng tiền hiện tại.
    /// </summary>
    public class QuotationSummaryDto
    {
        /// <summary>Mã task (tasks.task_id).</summary>
        public int TaskId { get; set; }

        /// <summary>Trạng thái task hiện tại (Pending, PendingApproval, ...).</summary>
        public string TaskStatus { get; set; } = string.Empty;

        /// <summary>Danh sách dòng vật tư đã thêm vào task.</summary>
        public List<MaterialLineDto> Materials { get; set; } = new();

        /// <summary>Tổng thành tiền = SUM(MaterialLineDto.Amount).</summary>
        public decimal TotalAmount { get; set; }
    }
}
