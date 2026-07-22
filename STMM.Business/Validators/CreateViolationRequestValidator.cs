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
                .MaximumLength(500)
                .WithMessage("Tiêu đề vi phạm không được vượt quá 500 ký tự.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Mô tả vi phạm không được để trống.");

            RuleFor(x => x.ImageUrl)
                .NotEmpty()
                .WithMessage("Ảnh minh chứng vi phạm là bắt buộc.");

            RuleFor(x => x.ImageUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .When(x => !string.IsNullOrEmpty(x.ImageUrl))
                .WithMessage("URL ảnh không đúng định dạng.");

            RuleFor(x => x.FineAmount)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Số tiền phạt không được âm.")
                .LessThan(1000000000).WithMessage("Số tiền phạt quá lớn (vượt quá 1 tỷ).");
        }
    }
}
