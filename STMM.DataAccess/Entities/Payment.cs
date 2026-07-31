using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Thông tin thanh toán giao dịch
/// </summary>
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

    /// <summary>Pending, Verified, Rejected or Refunded.</summary>
    public string Status { get; set; } = "Pending";

    public int? VerifiedByUserId { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public string? RejectionReason { get; set; }

    public DateTime? RejectedAt { get; set; }

    public int? RejectedByUserId { get; set; }

    public int? OriginalPaymentId { get; set; }

    public uint Version { get; set; } // For PostgreSQL xmin concurrency

    public virtual Invoice Invoice { get; set; } = null!;

    public virtual Payment? OriginalPayment { get; set; }
    public virtual ICollection<Payment> RefundPayments { get; set; } = new List<Payment>();
}
