using FluentValidation;
using STMM.Business.DTOs.Dashboard;

namespace STMM.Business.Validators
{
    public class CreateFeeTypeRequestValidator : AbstractValidator<CreateFeeTypeRequest>
    {
        public CreateFeeTypeRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên loại phí không được để trống.")
                .MaximumLength(100).WithMessage("Tên loại phí không vượt quá 100 ký tự.");

            RuleFor(x => x.Unit)
                .NotEmpty().WithMessage("Đơn vị tính không được để trống.")
                .MaximumLength(50).WithMessage("Đơn vị tính không vượt quá 50 ký tự.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không vượt quá 500 ký tự.");
        }
    }
}
