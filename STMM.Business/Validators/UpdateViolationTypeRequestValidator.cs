using FluentValidation;
using STMM.Business.DTOs.Violation;

namespace STMM.Business.Validators
{
    public class UpdateViolationTypeRequestValidator : AbstractValidator<UpdateViolationTypeRequest>
    {
        public UpdateViolationTypeRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên loại vi phạm không được để trống.")
                .MaximumLength(100).WithMessage("Tên loại vi phạm không vượt quá 100 ký tự.");

            RuleFor(x => x.DefaultFine)
                .GreaterThanOrEqualTo(0).WithMessage("Tiền phạt mặc định không được âm.")
                .LessThan(1000000000).WithMessage("Tiền phạt mặc định quá lớn (vượt quá 1 tỷ).");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không vượt quá 500 ký tự.");
        }
    }
}
