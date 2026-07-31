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
                .Cascade(CascadeMode.Stop)
                .NotEmpty()
                .WithMessage("RecordedAt is required.")
                .Must(val => TryParseRecordedAt(val, out _))
                .WithMessage("RecordedAt must be a valid date (yyyy-MM-dd).")
                .Must(BeInCurrentMonthAndNotInFuture)
                .WithMessage("RecordedAt must fall within the current month and cannot be a future date.");

            RuleFor(x => x.Image)
                .NotNull()
                .WithMessage("Meter reading evidence image is required.");
        }

        private static bool TryParseRecordedAt(string? value, out DateOnly recordedAt) =>
            DateOnly.TryParseExact(value, "yyyy-MM-dd", CultureInfo.InvariantCulture, DateTimeStyles.None, out recordedAt);

        /// <summary>
        /// A reading dated outside the current billing month corrupts the per-meter chain:
        /// the newest reading wins when resolving the previous value, so a future date would
        /// permanently block the meter and a backdated one would bill the wrong period.
        /// </summary>
        private static bool BeInCurrentMonthAndNotInFuture(string? value)
        {
            if (!TryParseRecordedAt(value, out var recordedAt))
            {
                return false;
            }

            // Readings are taken in market-local time (UTC+7), matching how staff task periods are computed.
            var today = DateOnly.FromDateTime(DateTime.UtcNow.AddHours(7));

            return recordedAt <= today
                && recordedAt.Year == today.Year
                && recordedAt.Month == today.Month;
        }
    }
}
