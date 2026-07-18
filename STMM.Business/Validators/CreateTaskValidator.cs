using FluentValidation;
using STMM.Business.DTOs.Task;
using System.Linq;

namespace STMM.Business.Validators
{
    public class CreateTaskValidator : AbstractValidator<CreateTaskRequest>
    {
        private static readonly string[] AllowedTypes = { "Repair", "Maintenance", "UtilityReading" };

        public CreateTaskValidator()
        {
            RuleFor(x => x.AssignedToUserId)
                .GreaterThan(0)
                .WithMessage("AssignedToUserId must be greater than 0.");

            RuleFor(x => x.TaskType)
                .NotEmpty()
                .WithMessage("TaskType is required.")
                .Must(x => AllowedTypes.Contains(x))
                .WithMessage($"TaskType must be one of: {string.Join(", ", AllowedTypes)}.");

            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Title is required.")
                .MinimumLength(5)
                .WithMessage("Title must be at least 5 characters long.");

            RuleFor(x => x)
                .Must(x => !(x.RequestId.HasValue && x.IssueId.HasValue))
                .WithMessage("A task cannot be linked to both a Request and an Issue at the same time.");

            RuleFor(x => x.AreaId)
                .NotEmpty()
                .WithMessage("Area is required for utility reading tasks.")
                .When(x => x.TaskType == "UtilityReading");
        }
    }
}
