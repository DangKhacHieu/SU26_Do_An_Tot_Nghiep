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
                .WithMessage("StallId must be greater than 0.");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Issue title is required.")
                .MinimumLength(5)
                .WithMessage("Issue title must be between 5 and 100 characters.")
                .MaximumLength(100)
                .WithMessage("Issue title must not exceed 100 characters.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Issue description is required.")
                .MinimumLength(10)
                .WithMessage("Issue description must be between 10 and 500 characters.")
                .MaximumLength(500)
                .WithMessage("Issue description must not exceed 500 characters.");

            RuleFor(x => x.Images)
                .Must(images => images == null || images.Count <= 3)
                .WithMessage("A maximum of 3 evidence images is allowed.");
        }
    }
}
