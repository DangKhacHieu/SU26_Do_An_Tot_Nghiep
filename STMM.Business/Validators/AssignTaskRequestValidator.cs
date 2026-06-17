using FluentValidation;
using STMM.Business.DTOs.Task;

namespace STMM.Business.Validators
{
    public class AssignTaskRequestValidator : AbstractValidator<AssignTaskRequest>
    {
        public AssignTaskRequestValidator()
        {
            RuleFor(x => x.StaffUserId)
                .GreaterThan(0)
                .WithMessage("StaffUserId must be greater than 0.");
        }
    }
}
