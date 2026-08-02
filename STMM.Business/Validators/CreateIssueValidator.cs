using FluentValidation;
using STMM.Business.DTOs.Issue;
using System;

namespace STMM.Business.Validators
{
    public class CreateIssueValidator : AbstractValidator<CreateIssueRequest>
    {
        public CreateIssueValidator()
        {
            RuleFor(x => x.StallId)
                .GreaterThan(0)
                .WithMessage("StallId phải lớn hơn 0.");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Tiêu đề sự cố không được để trống.")
                .MinimumLength(5)
                .WithMessage("Tiêu đề sự cố phải từ 5 đến 100 ký tự.")
                .MaximumLength(100)
                .WithMessage("Tiêu đề sự cố không được vượt quá 100 ký tự.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Mô tả sự cố không được để trống.")
                .MinimumLength(10)
                .WithMessage("Mô tả sự cố phải từ 10 đến 500 ký tự.")
                .MaximumLength(500)
                .WithMessage("Mô tả sự cố không được vượt quá 500 ký tự.");

            RuleFor(x => x.Images)
                .Must(images => images == null || images.Count <= 3)
                .WithMessage("A maximum of 3 evidence images is allowed.");
        }
    }
}
