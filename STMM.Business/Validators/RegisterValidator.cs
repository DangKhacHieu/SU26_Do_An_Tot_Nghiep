using FluentValidation;
using STMM.Business.DTOs.Auth;

namespace STMM.Business.Validators
{
    public class RegisterValidator : AbstractValidator<RegisterRequest>
    {
        public RegisterValidator()
        {
            RuleFor(x => x.Name)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Name is required.")
                .MaximumLength(100).WithMessage("Name cannot exceed 100 characters.");

            RuleFor(x => x.Email)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Email is required.")
                .EmailAddress().WithMessage("Invalid email address.")
                .MaximumLength(255).WithMessage("Email cannot exceed 255 characters.");

            RuleFor(x => x.Password)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Password is required.")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,12}$")
                .WithMessage("Password must be 8-12 characters and include uppercase, lowercase, numbers, and special characters.");

            RuleFor(x => x.Phone)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Phone number is required.")
                .Matches(@"^\d{9,11}$").WithMessage("Phone number must contain 9 to 11 digits.");

            RuleFor(x => x.Cccd)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("CCCD is required.")
                .Matches(@"^\d{9,12}$").WithMessage("CCCD must contain 9 to 12 digits.");
        }
    }
}