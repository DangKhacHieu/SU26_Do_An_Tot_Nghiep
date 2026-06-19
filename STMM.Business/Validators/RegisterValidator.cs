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
                .NotEmpty().WithMessage("Tên không được để trống")
                .MaximumLength(100).WithMessage("Tên không được vượt quá 100 ký tự");

            RuleFor(x => x.Email)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Email không được để trống")
                .EmailAddress().WithMessage("Email không hợp lệ")
                .MaximumLength(255).WithMessage("Email không được vượt quá 255 ký tự");

            RuleFor(x => x.Password)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Mật khẩu không được để trống")
                .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,12}$")
                .WithMessage("Mật khẩu phải từ 8-12 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt");

            RuleFor(x => x.Phone)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("Số điện thoại không được để trống")
                .Matches(@"^\d{9,11}$").WithMessage("Số điện thoại chỉ gồm 9-11 chữ số");

            RuleFor(x => x.Cccd)
                .Cascade(CascadeMode.Stop)
                .NotEmpty().WithMessage("CCCD không được để trống")
                .Matches(@"^\d{9,12}$").WithMessage("CCCD chỉ gồm 9-12 chữ số");
        }
    }
}