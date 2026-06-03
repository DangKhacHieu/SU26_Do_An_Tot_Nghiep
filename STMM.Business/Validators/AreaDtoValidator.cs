using FluentValidation;
using STMM.Business.DTOs.Area;

namespace STMM.Business.Validators
{
    public class AreaDtoValidator : AbstractValidator<AreaDto>
    {
        public AreaDtoValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Area name is required.")
                .MaximumLength(100).WithMessage("Area name cannot exceed 100 characters.");

            RuleFor(x => x.MarketId)
                .GreaterThan(0).WithMessage("MarketId must be valid.");
        }
    }
}
