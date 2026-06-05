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
                .WithMessage("Tiêu đề sự cố phải có ít nhất 5 ký tự.")
                .MaximumLength(500)
                .WithMessage("Tiêu đề sự cố không được vượt quá 500 ký tự.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Mô tả sự cố không được để trống.")
                .MinimumLength(10)
                .WithMessage("Mô tả sự cố phải có ít nhất 10 ký tự.");

            RuleFor(x => x.ImageUrl)
                .Must(urlStr => urlStr!.Split(';', StringSplitOptions.RemoveEmptyEntries)
                    .All(url => Uri.TryCreate(url.Trim(), UriKind.Absolute, out _)))
                .When(x => !string.IsNullOrEmpty(x.ImageUrl))
                .WithMessage("URL ảnh không đúng định dạng hoặc chứa URL không hợp lệ.");
        }
    }
}
