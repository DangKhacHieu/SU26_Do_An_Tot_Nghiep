using FluentValidation;
using STMM.Business.DTOs.Dashboard;

namespace STMM.Business.Validators
{
    public class CreateServiceRequestValidator : AbstractValidator<CreateServiceRequest>
    {
        public CreateServiceRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên dịch vụ không được để trống.")
                .MaximumLength(150).WithMessage("Tên dịch vụ không vượt quá 150 ký tự.");

            RuleFor(x => x.Price)
                .GreaterThanOrEqualTo(0).WithMessage("Đơn giá dịch vụ phải lớn hơn hoặc bằng 0.")
                .LessThan(1000000000).WithMessage("Đơn giá dịch vụ quá lớn (vượt quá 1 tỷ).");

            RuleFor(x => x.BillingCycle)
                .NotEmpty().WithMessage("Chu kỳ tính phí không được để trống.")
                .Must(x => x == "Monthly" || x == "One-time" || x == "Yearly")
                .WithMessage("Chu kỳ tính phí phải là 'Monthly', 'One-time' hoặc 'Yearly'.");

            RuleFor(x => x.FeeTypeId)
                .GreaterThan(0).WithMessage("Loại phí liên kết không hợp lệ.");

            RuleFor(x => x.CreatedByUserId)
                .GreaterThan(0).WithMessage("Mã người tạo không hợp lệ.");

            RuleFor(x => x.Description)
                .MaximumLength(500).WithMessage("Mô tả dịch vụ không vượt quá 500 ký tự.");
        }
    }
}
