using FluentValidation;
using STMM.Business.DTOs.Billing;

namespace STMM.Business.Validators
{
    public class CreateAdHocInvoiceRequestValidator : AbstractValidator<CreateAdHocInvoiceRequest>
    {
        public CreateAdHocInvoiceRequestValidator()
        {
            RuleFor(x => x.StallId)
                .GreaterThan(0).WithMessage("StallId không hợp lệ.");

            RuleFor(x => x.Amount)
                .GreaterThan(0).WithMessage("Số tiền phải lớn hơn 0.")
                .LessThan(10000000000).WithMessage("Số tiền quá lớn.");

            RuleFor(x => x.Description)
                .NotEmpty().WithMessage("Mô tả không được để trống.")
                .MaximumLength(500).WithMessage("Mô tả không vượt quá 500 ký tự.");

            RuleFor(x => x.Month)
                .InclusiveBetween(1, 12).WithMessage("Tháng phải từ 1 đến 12.");

            RuleFor(x => x.Year)
                .InclusiveBetween(2000, 2100).WithMessage("Năm không hợp lệ.");

            RuleFor(x => x.DueDate)
                .NotEmpty().WithMessage("Ngày hạn thanh toán không được để trống.");
        }
    }
}
