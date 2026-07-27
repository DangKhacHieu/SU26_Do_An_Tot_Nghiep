using FluentValidation;
using STMM.Business.DTOs.Request;

namespace STMM.Business.Validators
{
    public sealed class ManagerQuotationDecisionValidator : AbstractValidator<ManagerQuotationDecisionRequest>
    {
        private static readonly string[] AllowedActions =
        {
            ManagerQuotationDecisionRequest.ApproveAsMarket,
            ManagerQuotationDecisionRequest.SendToVendor,
            ManagerQuotationDecisionRequest.ReturnForRevision,
            ManagerQuotationDecisionRequest.Reject
        };

        public ManagerQuotationDecisionValidator()
        {
            RuleFor(x => x.Action)
                .NotEmpty()
                .Must(action => AllowedActions.Contains(action))
                .WithMessage("Quyết định xử lý báo giá không hợp lệ.");

            RuleFor(x => x.ContractClause)
                .NotEmpty()
                .MaximumLength(500)
                .When(AssignsPayer)
                .WithMessage("Vui lòng chọn điều khoản hợp đồng làm căn cứ xác định bên chịu phí.");

            RuleFor(x => x.DecisionNote)
                .NotEmpty()
                .MinimumLength(10)
                .MaximumLength(1000)
                .When(RequiresDecisionNote)
                .WithMessage("Ghi chú quyết định phải có từ 10 đến 1000 ký tự.");

            RuleFor(x => x.DecisionNote)
                .MaximumLength(1000)
                .When(x => !string.IsNullOrWhiteSpace(x.DecisionNote));
        }

        private static bool AssignsPayer(ManagerQuotationDecisionRequest request)
        {
            return request.Action is ManagerQuotationDecisionRequest.ApproveAsMarket
                or ManagerQuotationDecisionRequest.SendToVendor;
        }

        private static bool RequiresDecisionNote(ManagerQuotationDecisionRequest request)
        {
            var closesOrReturnsRequest = request.Action is ManagerQuotationDecisionRequest.ReturnForRevision
                or ManagerQuotationDecisionRequest.Reject;
            var usesOtherClause = AssignsPayer(request)
                && request.ContractClause == ManagerQuotationDecisionRequest.OtherContractClause;

            return closesOrReturnsRequest || usesOtherClause;
        }
    }
}
