using FluentValidation;
using STMM.Business.DTOs.Issue;
using System.Linq;

namespace STMM.Business.Validators
{
    public class UpdateIssueStatusValidator : AbstractValidator<UpdateIssueStatusRequest>
    {
        private static readonly string[] AllowedStatuses = { "InProgress", "Resolved" };

        public UpdateIssueStatusValidator()
        {
            RuleFor(x => x.NewStatus)
                .NotEmpty()
                .WithMessage("Trạng thái mới không được để trống.")
                .Must(status => AllowedStatuses.Contains(status))
                .WithMessage($"Trạng thái mới không hợp lệ. Chỉ chấp nhận các giá trị: {string.Join(", ", AllowedStatuses)}.");
        }
    }
}
