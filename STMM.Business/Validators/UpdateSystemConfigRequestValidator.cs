using FluentValidation;
using STMM.Business.DTOs.Dashboard;
using System;

namespace STMM.Business.Validators
{
    public class UpdateSystemConfigRequestValidator : AbstractValidator<UpdateSystemConfigRequest>
    {
        public UpdateSystemConfigRequestValidator()
        {
            RuleFor(x => x.ConfigKey)
                .NotEmpty().WithMessage("Khóa cấu hình không được để trống.");

            RuleFor(x => x.ConfigValue)
                .NotEmpty().WithMessage("Giá trị cấu hình không được để trống.")
                .Custom((val, context) =>
                {
                    var key = context.InstanceToValidate.ConfigKey;
                    if (key == "invoice_due_days")
                    {
                        if (!int.TryParse(val, out var dueDays) || dueDays <= 0)
                        {
                            context.AddFailure("Số ngày hạn thanh toán hóa đơn phải là số nguyên dương lớn hơn 0.");
                        }
                    }
                    else if (key == "vat_rate")
                    {
                        if (!double.TryParse(val, out var vat) || vat < 0 || vat > 100)
                        {
                            context.AddFailure("Thuế suất VAT phải là số từ 0 đến 100 (%).");
                        }
                    }
                    else if (key == "auto_invoice_day")
                    {
                        if (!int.TryParse(val, out var day) || day < 1 || day > 28)
                        {
                            context.AddFailure("Ngày tự động xuất hóa đơn phải nằm trong khoảng từ 1 đến 28.");
                        }
                    }
                });

            RuleFor(x => x.UpdatedByUserId)
                .GreaterThan(0).WithMessage("Mã người cập nhật không hợp lệ.");
        }
    }
}
