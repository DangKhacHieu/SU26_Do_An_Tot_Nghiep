using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Faq
{
    /// <summary>
    /// Mã định danh câu hỏi
    /// </summary>
    public int FaqId { get; set; }

    /// <summary>
    /// Phân loại (General, Contract, Payment, Rules)
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// Nội dung câu hỏi
    /// </summary>
    public string Question { get; set; } = null!;

    /// <summary>
    /// Nội dung câu trả lời
    /// </summary>
    public string Answer { get; set; } = null!;

    /// <summary>
    /// Admin/Manager tạo FAQ
    /// </summary>
    public int CreatedByUserId { get; set; }

    /// <summary>
    /// Đánh dấu ẩn/hiện FAQ
    /// </summary>
    public bool? IsActive { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual User CreatedByUser { get; set; } = null!;
}
