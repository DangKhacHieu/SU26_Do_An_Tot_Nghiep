using FluentValidation;
using STMM.Business.DTOs.User;

namespace STMM.Business.Validators
{
    public class UpdateUserValidator : AbstractValidator<UpdateUserRequest>
    {
        public UpdateUserValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Họ tên không được để trống.")
                .MaximumLength(100).WithMessage("Họ tên không vượt quá 100 ký tự.");

            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email không được để trống.")
                .EmailAddress().WithMessage("Email không đúng định dạng.");

            RuleFor(x => x.Phone)
                .NotEmpty().WithMessage("Số điện thoại không được để trống.")
                .Matches(@"^\d{10,11}$").WithMessage("Số điện thoại phải có 10 hoặc 11 chữ số.");

            RuleFor(x => x.Cccd)
                .NotEmpty().WithMessage("Số CCCD không được để trống.")
                .Matches(@"^\d{12}$").WithMessage("Số CCCD phải có đúng 12 chữ số.");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Trạng thái không được để trống.")
                .Must(status => status == "Active" || status == "Locked" || status == "Suspended")
                .WithMessage("Trạng thái phải là Active, Locked hoặc Suspended.");

            RuleFor(x => x.RoleId)
                .GreaterThan(0).WithMessage("Vai trò không hợp lệ.");

            RuleFor(x => x.Password)
                .MinimumLength(6).WithMessage("Mật khẩu phải từ 6 ký tự trở lên.")
                .When(x => !string.IsNullOrEmpty(x.Password));
        }
    }
}
