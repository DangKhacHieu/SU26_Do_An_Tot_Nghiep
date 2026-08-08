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
                .NotEmpty().WithMessage("Họ và tên không được để trống.")
                .MaximumLength(100).WithMessage("Họ và tên không được vượt quá 100 ký tự.");

            RuleFor(x => x.Phone)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Số điện thoại không được để trống.")
                .Matches(@"^\d{9,11}$").WithMessage("Số điện thoại phải chứa từ 9 đến 11 chữ số.");
        }
    }
}
