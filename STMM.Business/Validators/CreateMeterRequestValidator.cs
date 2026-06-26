using FluentValidation;
using STMM.Business.DTOs.Meter;
using System.Linq;

namespace STMM.Business.Validators
{
    public class CreateMeterRequestValidator : AbstractValidator<CreateMeterRequest>
    {
        private static readonly string[] AllowedTypes = { "Electricity", "Water" };

        public CreateMeterRequestValidator()
        {
            RuleFor(x => x.SerialNumber)
                .NotEmpty()
                .WithMessage("SerialNumber is required.")
                .MaximumLength(50)
                .WithMessage("SerialNumber must not exceed 50 characters.");

            RuleFor(x => x.Type)
                .NotEmpty()
                .WithMessage("Type is required.")
                .Must(x => AllowedTypes.Contains(x))
                .WithMessage($"Type must be one of: {string.Join(", ", AllowedTypes)}.");
        }
    }
}
