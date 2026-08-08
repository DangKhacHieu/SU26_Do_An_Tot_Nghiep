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
                .WithMessage("StallId must be greater than 0.");

            RuleFor(x => x.ViolationTypeId)
                .GreaterThan(0)
                .WithMessage("ViolationTypeId must be greater than 0.");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Violation title is required.")
                .MinimumLength(5)
                .WithMessage("Violation title must be between 5 and 100 characters.")
                .MaximumLength(100)
                .WithMessage("Violation title must not exceed 100 characters.");

            RuleFor(x => x.Description)
                .NotEmpty()
                .WithMessage("Violation description is required.")
                .MinimumLength(10)
                .WithMessage("Violation description must be between 10 and 500 characters.")
                .MaximumLength(500)
                .WithMessage("Violation description must not exceed 500 characters.");

            RuleFor(x => x.Image)
                .NotNull()
                .WithMessage("Violation evidence image is required.");

            RuleFor(x => x.FineAmount)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Fine amount cannot be negative.")
                .LessThan(1000000000).WithMessage("Fine amount is too large (exceeds 1 billion).");
        }
    }
}
