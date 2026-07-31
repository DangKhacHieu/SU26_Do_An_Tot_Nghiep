using System;
using FluentValidation;
using STMM.Business.DTOs.Contract;

namespace STMM.Business.Validators
{
    public class CreateContractRequestValidator : AbstractValidator<CreateContractRequest>
    {
        public CreateContractRequestValidator()
        {
            RuleFor(x => x.StallId)
                .NotEmpty().WithMessage("Sạp hàng không được để trống.")
                .GreaterThan(0).WithMessage("Sạp hàng không hợp lệ.");

            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("Tài khoản tiểu thương không được để trống.")
                .GreaterThan(0).WithMessage("Tài khoản tiểu thương không hợp lệ.");

            RuleFor(x => x.StartDate)
                .NotEmpty().WithMessage("Ngày bắt đầu không được để trống.")
                .GreaterThanOrEqualTo(DateOnly.FromDateTime(DateTime.Today)).WithMessage("Ngày bắt đầu hợp đồng không được trước ngày hôm nay.");

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
