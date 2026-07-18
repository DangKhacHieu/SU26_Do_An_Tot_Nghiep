using FluentValidation;
using STMM.Business.DTOs.Task;
using System.Linq;

namespace STMM.Business.Validators
{
    public class UpdateTaskStatusValidator : AbstractValidator<UpdateTaskStatusRequest>
    {
        private static readonly string[] AllowedStatuses = { "In_Progress", "Cancelled", "Pending" };

        public UpdateTaskStatusValidator()
        {
            RuleFor(x => x.NewStatus)
                .NotEmpty()
                .WithMessage("NewStatus is required.")
                .Must(x => AllowedStatuses.Contains(x))
                .WithMessage($"NewStatus must be one of: {string.Join(", ", AllowedStatuses)}.");
        }
    }
}
