using System;
using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Violation
{
    public class CreateViolationInvoiceRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập số tiền phạt.")]
        [Range(1, double.MaxValue, ErrorMessage = "Số tiền phải lớn hơn 0.")]
        public decimal Amount { get; set; }

        [Required(ErrorMessage = "Vui lòng chọn hạn thanh toán.")]
        public DateOnly DueDate { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập lý do xuất hóa đơn.")]
        [MaxLength(500, ErrorMessage = "Lý do không được vượt quá 500 ký tự.")]
        public string Description { get; set; }
    }
}
