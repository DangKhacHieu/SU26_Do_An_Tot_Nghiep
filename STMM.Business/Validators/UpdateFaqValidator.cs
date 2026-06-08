using FluentValidation;
using STMM.Business.DTOs.Faq;

namespace STMM.Business.Validators
{
    public class UpdateFaqValidator : AbstractValidator<UpdateFaqRequest>
    {
        public UpdateFaqValidator()
        {
            RuleFor(x => x.Question)
                .NotEmpty().WithMessage("Câu hỏi không được để trống.")
                .MaximumLength(500).WithMessage("Câu hỏi không được dài quá 500 ký tự.");

            RuleFor(x => x.Answer)
                .NotEmpty().WithMessage("Câu trả lời không được để trống.");

            RuleFor(x => x.Category)
                .Must(cat => string.IsNullOrEmpty(cat) || 
                             cat == "General" || 
                             cat == "Contract" || 
                             cat == "Payment" || 
                             cat == "Rules")
                .WithMessage("Danh mục FAQ phải thuộc các loại: General, Contract, Payment, Rules.");
        }
    }
}
