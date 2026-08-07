using FluentValidation;
using STMM.Business.DTOs.Billing;

namespace STMM.Business.Validators
{
    public class MeterReadingAdjustmentRequestValidator : AbstractValidator<MeterReadingAdjustmentRequest>
    {
        public MeterReadingAdjustmentRequestValidator()
        {
            RuleFor(x => x.StallId)
                .GreaterThan(0).WithMessage("StallId không hợp lệ.");

            RuleFor(x => x.OldValue)
                .GreaterThanOrEqualTo(0).WithMessage("Chỉ số cũ không được âm.");

            RuleFor(x => x.NewValue)
                .InclusiveBetween(0, 999999).WithMessage("Chỉ số mới phải nằm trong khoảng từ 0 đến 999,999.")
                .Must(x => x % 1 == 0).WithMessage("Chỉ số mới phải là số nguyên.")
                .GreaterThanOrEqualTo(x => x.OldValue).WithMessage("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
                
            RuleFor(x => x.MeterType)
                .Must(x => x == "Electricity" || x == "Water").WithMessage("Loại đồng hồ phải là Electricity hoặc Water.");
                
            RuleFor(x => x.Month)
                .InclusiveBetween(1, 12).WithMessage("Tháng phải từ 1 đến 12.");
                
            RuleFor(x => x.Year)
                .InclusiveBetween(2000, 2100).WithMessage("Năm không hợp lệ.");
                
            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Lý do điều chỉnh không được để trống.");
                
            RuleFor(x => x.ImageUrl)
                .NotEmpty().WithMessage("Ảnh chứng từ không được để trống.")
                .NotEqual("N/A").WithMessage("Ảnh chứng từ không hợp lệ.");
        }
    }
}
