using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

public partial class Payment
{
    /// <summary>
    /// Mã bản ghi giao dịch
    /// </summary>
    public int PaymentId { get; set; }

    /// <summary>
    /// Thanh toán cho hóa đơn nào
    /// </summary>
    public int InvoiceId { get; set; }

    /// <summary>
    /// Số tiền thực thu (VNĐ)
    /// </summary>
    public decimal Amount { get; set; }

    /// <summary>
    /// Phương thức nộp tiền (Momo, Cash)
    /// </summary>
    public string Method { get; set; } = null!;

    /// <summary>
    /// Mã giao dịch hoặc mã biên nhận
    /// </summary>
    public string? TransactionCode { get; set; }

    /// <summary>
    /// Thời điểm thanh toán
    /// </summary>
    public DateTime? PaidAt { get; set; }

    public virtual Invoice Invoice { get; set; } = null!;
}
