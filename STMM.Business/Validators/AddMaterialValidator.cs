using FluentValidation;
using STMM.Business.DTOs.Quotation;

namespace STMM.Business.Validators
{
    /// <summary>
    /// Validates AddMaterialRequest — basic structural rules only.
    /// Business rule "CustomUnitPrice required when Price==0" is enforced in QuotationService
    /// because it requires loading the RepairPrice entity from the database.
    /// </summary>
    public class AddMaterialValidator : AbstractValidator<AddMaterialRequest>
    {
        public AddMaterialValidator()
        {
            RuleFor(x => x.RepairPriceId)
                .GreaterThan(0)
                .WithMessage("RepairPriceId must be greater than 0.");

            RuleFor(x => x.Quantity)
                .GreaterThan(0)
                .WithMessage("Quantity must be greater than 0.");

            RuleFor(x => x.CustomUnitPrice)
                .GreaterThan(0)
                .WithMessage("Custom unit price must be greater than 0.")
                .When(x => x.CustomUnitPrice.HasValue);
        }
    }
}
