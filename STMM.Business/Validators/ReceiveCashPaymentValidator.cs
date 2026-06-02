using FluentValidation;
using STMM.Business.DTOs.Billing;

namespace STMM.Business.Validators
{
    public class ReceiveCashPaymentValidator : AbstractValidator<ReceiveCashPaymentRequest>
    {
        public ReceiveCashPaymentValidator()
        {
            RuleFor(x => x.InvoiceId)
                .GreaterThan(0)
                .WithMessage("InvoiceId phải lớn hơn 0.");
        }
    }
}
