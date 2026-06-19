using FluentValidation;
using STMM.Business.DTOs.Contract;

namespace STMM.Business.Validators
{
    public class RenewContractRequestValidator : AbstractValidator<RenewContractRequest>
    {
        public RenewContractRequestValidator()
        {
            RuleFor(x => x.StartDate)
                .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.");

            RuleFor(x => x.EndDate)
                .NotEmpty().WithMessage("Ngày kết thúc không được để trống.")
                .GreaterThan(x => x.StartDate).WithMessage("Ngày kết thúc phải sau ngày bắt đầu.");

            RuleFor(x => x.RentFee)
                .GreaterThanOrEqualTo(0).WithMessage("Giá thuê không được nhỏ hơn 0.");

            RuleFor(x => x.Deposit)
                .GreaterThanOrEqualTo(0).WithMessage("Tiền đặt cọc không được nhỏ hơn 0.");
        }
    }
}
