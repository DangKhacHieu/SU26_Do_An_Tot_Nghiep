using FluentValidation;
using STMM.Business.DTOs.Auth;

namespace STMM.Business.Validators
{
    public class ChangePasswordValidator : AbstractValidator<ChangePasswordRequest>
    {
        public ChangePasswordValidator()
        {
            RuleFor(x => x.CurrentPassword)
                .NotEmpty().WithMessage("Mật khẩu cũ không được để trống");

            RuleFor(x => x.NewPassword)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Mật khẩu mới không được để trống")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,12}$")
                .WithMessage("Mật khẩu mới phải từ 8-12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt");
        }
    }
}
