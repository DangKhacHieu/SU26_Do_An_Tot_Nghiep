using FluentValidation;
using STMM.Business.DTOs.BusinessCategory;

namespace STMM.Business.Validators
{
    public class UpdateBusinessCategoryRequestValidator : AbstractValidator<UpdateBusinessCategoryRequest>
    {
        public UpdateBusinessCategoryRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên ngành hàng không được để trống.")
                .MaximumLength(100).WithMessage("Tên ngành hàng không được vượt quá 100 ký tự.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không được vượt quá 500 ký tự.");
        }
    }
}
