using FluentValidation;
using STMM.Business.DTOs.Meter;
using System;
using System.Globalization;

namespace STMM.Business.Validators
{
    public class CreateMeterReadingRequestValidator : AbstractValidator<CreateMeterReadingRequest>
    {
        public CreateMeterReadingRequestValidator()
        {
            RuleFor(x => x.MeterId)
                .GreaterThan(0)
                .WithMessage("MeterId must be greater than 0.");

            RuleFor(x => x.NewValue)
                .GreaterThanOrEqualTo(0)
                .WithMessage("NewValue must not be negative.");

            RuleFor(x => x.RecordedAt)
                .NotEmpty()
                .WithMessage("RecordedAt is required.")
                .Must(val => DateOnly.TryParseExact(val, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out _))
                .WithMessage("RecordedAt must be a valid date (yyyy-MM-dd).");

            RuleFor(x => x.ImageUrl)
                .NotEmpty()
                .WithMessage("Image URL is required (photo of meter face).");

            RuleFor(x => x.ImageUrl)
                .Must(url => Uri.TryCreate(url, UriKind.Absolute, out _))
                .When(x => !string.IsNullOrEmpty(x.ImageUrl))
                .WithMessage("Image URL format is invalid.");
        }
    }
}
