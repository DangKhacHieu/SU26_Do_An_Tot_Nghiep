using FluentValidation;
using STMM.Business.DTOs.Request;

namespace STMM.Business.Validators
{
    public class VendorQuotationDecisionValidator : AbstractValidator<VendorQuotationDecisionRequest>
    {
        public VendorQuotationDecisionValidator()
        {
            RuleFor(x => x.Reason)
                .NotEmpty().WithMessage("Vui lòng nhập lý do từ chối.")
                .Length(10, 1000).WithMessage("Lý do từ chối phải dài từ 10 đến 1000 ký tự.")
                .When(x => !x.IsApproved);
        }
    }
}

