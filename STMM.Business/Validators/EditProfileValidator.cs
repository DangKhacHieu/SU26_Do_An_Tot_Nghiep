using FluentValidation;
using STMM.Business.DTOs.User;

namespace STMM.Business.Validators
{
    public class EditProfileValidator : AbstractValidator<EditProfileRequest>
    {
        public EditProfileValidator()
        {
            RuleFor(x => x.Name)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

            RuleFor(x => x.Phone)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Phone number is required.")
                .Matches(@"^\d{9,11}$").WithMessage("Phone number must contain 9 to 11 digits.");
        }
    }
}
