using FluentValidation;
using STMM.Business.DTOs.Dashboard;
using System.Linq;

namespace STMM.Business.Validators
{
    public class UpdateTiersRequestValidator : AbstractValidator<UpdateTiersRequest>
    {
        public UpdateTiersRequestValidator()
        {
            RuleFor(x => x.ConfigKey)
                .NotEmpty().WithMessage("Khóa cấu hình biểu giá không được để trống.")
                .Must(x => x == "electricity_tiers" || x == "water_tiers")
                .WithMessage("Khóa cấu hình biểu giá phải là 'electricity_tiers' hoặc 'water_tiers'.");

            RuleFor(x => x.Steps)
                .NotEmpty().WithMessage("Danh sách bậc thang không được để trống.")
                .Custom((steps, context) =>
                {
                    if (steps == null || !steps.Any()) return;

                    var sortedSteps = steps.OrderBy(s => s.Step).ToList();
                    for (int i = 0; i < sortedSteps.Count; i++)
                    {
                        var step = sortedSteps[i];

                        if (step.Price < 0)
                        {
                            context.AddFailure($"Đơn giá tại bậc {step.Step} không được nhỏ hơn 0.");
                        }

                        if (i == 0)
                        {
                            if (step.From != 0)
                            {
                                context.AddFailure("Bậc đầu tiên phải bắt đầu từ số 0.");
                            }
                        }
                        else
                        {
                            var prevStep = sortedSteps[i - 1];
                            if (prevStep.To == null)
                            {
                                context.AddFailure($"Bậc {prevStep.Step} là bậc cuối (Vô hạn), không thể có thêm bậc {step.Step} phía sau.");
                            }
                            else if (step.From != prevStep.To + 1)
                            {
                                context.AddFailure($"Bậc {step.Step} (bắt đầu từ {step.From}) phải tiếp nối liên tục từ Bậc {prevStep.Step} (kết thúc ở {prevStep.To}).");
                            }
                        }

                        if (step.To != null && step.To <= step.From)
                        {
                            context.AddFailure($"Bậc {step.Step} có giới hạn kết thúc ({step.To}) phải lớn hơn chỉ số bắt đầu ({step.From}).");
                        }

                        if (i == sortedSteps.Count - 1)
                        {
                            if (step.To != null)
                            {
                                context.AddFailure("Bậc cuối cùng phải có giới hạn kết thúc là vô hạn (Null/Không giới hạn).");
                            }
                        }
                    }
                });

            RuleFor(x => x.UpdatedByUserId)
                .GreaterThan(0).WithMessage("Mã người cập nhật không hợp lệ.");
        }
    }
}
