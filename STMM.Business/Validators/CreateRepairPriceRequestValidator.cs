using FluentValidation;
using STMM.Business.DTOs.RepairPrice;

namespace STMM.Business.Validators
{
    public class CreateRepairPriceRequestValidator : AbstractValidator<CreateRepairPriceRequest>
    {
        public CreateRepairPriceRequestValidator()
        {
            RuleFor(x => x.ItemName)
                .NotEmpty().WithMessage("Tên hạng mục không được để trống.")
                .MaximumLength(100).WithMessage("Tên hạng mục không vượt quá 100 ký tự.");

            RuleFor(x => x.Unit)
                .NotEmpty().WithMessage("Đơn vị tính không được để trống.")
                .MaximumLength(50).WithMessage("Đơn vị tính không vượt quá 50 ký tự.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Đơn giá không được âm.")
                .LessThan(1000000000).WithMessage("Đơn giá quá lớn (vượt quá 1 tỷ).");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả không vượt quá 500 ký tự.");
        }
    }
}
