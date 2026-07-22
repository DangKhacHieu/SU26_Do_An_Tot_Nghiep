using System;
using System.Collections.Generic;

namespace STMM.Business.DTOs.Billing
{
    public class PaymentVerificationDto
    {
        public int PaymentId { get; set; }
        public string TransactionCode { get; set; } = null!;
        public string Method { get; set; } = null!;
        public decimal Amount { get; set; }
        public DateTime? PaidAt { get; set; }
        public int InvoiceId { get; set; }
        public string StallCode { get; set; } = null!;
        public string TenantName { get; set; } = null!;
        public string Status { get; set; } = null!; // "Pending", "Approved"
    }

    public class VerifyPaymentRequest
    {
        public bool Approve { get; set; }
        public string? RejectionNote { get; set; }
    }

    public class DebtOfStallDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public string TenantName { get; set; } = null!;
        public decimal RentDebt { get; set; }
        public decimal UtilityDebt { get; set; }
        public decimal ViolationDebt { get; set; }
        public decimal TotalDebt { get; set; }
        public DateOnly? LastDueDate { get; set; }
    }

    public class StallDebtDetailDto
    {
        public int StallId { get; set; }
        public string StallCode { get; set; } = null!;
        public string TenantName { get; set; } = null!;
        public List<UnpaidInvoiceDetailDto> UnpaidInvoices { get; set; } = new();
        public List<UnpaidViolationDetailDto> UnpaidViolations { get; set; } = new();
    }

    public class UnpaidInvoiceDetailDto
    {
        public int InvoiceId { get; set; }
        public int Month { get; set; }
        public int Year { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = null!;
        public DateOnly? DueDate { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class UnpaidViolationDetailDto
    {
        public int ViolationId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public decimal FineAmount { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class DisputeResolutionDto
    {
        public int RequestId { get; set; }
        public int? InvoiceId { get; set; }
        public string Title { get; set; } = null!;
        public string? Description { get; set; }
        public string Status { get; set; } = null!; // "Pending", "Approved", "Rejected"
        public DateTime? CreatedAt { get; set; }
        public string StallCode { get; set; } = null!;
        public string TenantName { get; set; } = null!;
        public string? VendorBankName { get; set; }
        public string? VendorBankAccount { get; set; }
        public int InvoiceMonth { get; set; }
        public int InvoiceYear { get; set; }
        public decimal InvoiceTotalAmount { get; set; }
        public string? InvoiceStatus { get; set; }
    }

    public class ResolveDisputeRequest
    {
        public bool Approve { get; set; }
        public string? Feedback { get; set; }
        public bool IsRefund { get; set; }
        public decimal? RefundAmount { get; set; }
        public string? RefundMethod { get; set; } // "Transfer" or "Cash"
        public string? TransactionCode { get; set; }
    }

    public class SendDebtNotificationRequest
    {
        public int StallId { get; set; }
        public string? CustomMessage { get; set; }
    }
}
