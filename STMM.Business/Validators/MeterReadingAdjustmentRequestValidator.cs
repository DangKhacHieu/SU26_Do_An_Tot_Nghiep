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
                .GreaterThanOrEqualTo(0).WithMessage("Chỉ số mới không được âm.")
                .GreaterThanOrEqualTo(x => x.OldValue).WithMessage("Chỉ số mới không được nhỏ hơn chỉ số cũ.");
        }
    }
}
