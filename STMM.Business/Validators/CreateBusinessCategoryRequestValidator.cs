using FluentValidation;
using STMM.Business.DTOs.BusinessCategory;

namespace STMM.Business.Validators
{
    public class CreateBusinessCategoryRequestValidator : AbstractValidator<CreateBusinessCategoryRequest>
    {
        public CreateBusinessCategoryRequestValidator()
        {
            RuleFor(x => x.Code)
                .NotEmpty().WithMessage("Mã ngành hàng không được để trống.")
                .MaximumLength(50).WithMessage("Mã ngành hàng không được vượt quá 50 ký tự.")
                .Matches("^[A-Z0-9_]+$").WithMessage("Mã ngành hàng chỉ được chứa chữ hoa, số và dấu gạch dưới.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên ngành hàng không được để trống.")
                .MaximumLength(100).WithMessage("Tên ngành hàng không được vượt quá 100 ký tự.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không được vượt quá 500 ký tự.");
        }
    }
}
