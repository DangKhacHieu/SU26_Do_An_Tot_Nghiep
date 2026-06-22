using FluentValidation;
using STMM.Business.DTOs.Meter;

namespace STMM.Business.Validators
{
    public class MeterReplacementRequestValidator : AbstractValidator<MeterReplacementRequest>
    {
        public MeterReplacementRequestValidator()
        {
            RuleFor(x => x.StallId)
                .GreaterThan(0)
                .WithMessage("StallId must be greater than 0.");

            RuleFor(x => x.OldMeterId)
                .GreaterThan(0)
                .WithMessage("OldMeterId must be greater than 0.");

            RuleFor(x => x.NewMeterId)
                .GreaterThan(0)
                .WithMessage("NewMeterId must be greater than 0.")
                .NotEqual(x => x.OldMeterId)
                .WithMessage("NewMeterId must be different from OldMeterId.");
        }
    }
}
