using FluentValidation;
using STMM.Business.DTOs.Violation;

namespace STMM.Business.Validators
{
    public class CreateViolationRequestValidator : AbstractValidator<CreateViolationRequest>
    {
        public CreateViolationRequestValidator()
        {
            RuleFor(x => x.StallId)
                .GreaterThan(0)
                .WithMessage("StallId phải lớn hơn 0.");

            RuleFor(x => x.ViolationTypeId)
                .GreaterThan(0)
                .WithMessage("ViolationTypeId phải lớn hơn 0.");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Tiêu đề vi phạm không được để trống.")
                .MinimumLength(5)
                .WithMessage("Tiêu đề vi phạm phải từ 5 đến 100 ký tự.")
                .MaximumLength(100)
                .WithMessage("Tiêu đề vi phạm không được vượt quá 100 ký tự.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Mô tả vi phạm không được để trống.")
                .MinimumLength(10)
                .WithMessage("Mô tả vi phạm phải từ 10 đến 500 ký tự.")
                .MaximumLength(500)
                .WithMessage("Mô tả vi phạm không được vượt quá 500 ký tự.");

            RuleFor(x => x.Image)
                .NotNull()
                .WithMessage("Violation evidence image is required.");

            RuleFor(x => x.FineAmount)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Số tiền phạt không được âm.")
                .LessThan(1000000000).WithMessage("Số tiền phạt quá lớn (vượt quá 1 tỷ).");
        }
    }
}
