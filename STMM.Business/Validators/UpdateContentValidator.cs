using FluentValidation;
using STMM.Business.DTOs.Content;

namespace STMM.Business.Validators
{
    public class UpdateContentValidator : AbstractValidator<UpdateContentRequest>
    {
        public UpdateContentValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Tiêu đề không được để trống.")
                .MaximumLength(200).WithMessage("Tiêu đề không được dài quá 200 ký tự.");

            RuleFor(x => x.Content)
                .NotEmpty().WithMessage("Nội dung không được để trống.");

            RuleFor(x => x.NotiType)
                .NotEmpty().WithMessage("Loại nội dung không được để trống.");

            RuleFor(x => x.TargetRole)
                .Must(role => string.IsNullOrEmpty(role) || role == "Public" || role == "Staff" || role == "Accountant" || role == "Vendor" || role == "Customer")
                .WithMessage("Đối tượng nhận tin không hợp lệ. Phải là Public, Staff, Accountant, Vendor hoặc Customer.");
        }
    }
}
