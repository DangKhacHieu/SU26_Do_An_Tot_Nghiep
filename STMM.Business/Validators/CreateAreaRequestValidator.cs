using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using STMM.Business.DTOs.Area;
using STMM.DataAccess.IRepositories;
using Microsoft.EntityFrameworkCore;

namespace STMM.Business.Validators
{
    public class CreateAreaRequestValidator : AbstractValidator<CreateAreaRequest>
    {
        public CreateAreaRequestValidator()
        {
            RuleFor(x => x.MarketId)
                .GreaterThan(0).WithMessage("Mã chợ (MarketId) không hợp lệ.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên khu vực không được để trống.")
                .MaximumLength(255).WithMessage("Tên khu vực không được vượt quá 255 ký tự.");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).When(x => x.CategoryId.HasValue).WithMessage("Mã danh mục không hợp lệ.");

            RuleFor(x => x.CategoryName)
                .MaximumLength(255).When(x => !string.IsNullOrEmpty(x.CategoryName)).WithMessage("Tên danh mục không được vượt quá 255 ký tự.");

            RuleFor(x => x)
                .Must(HaveValidGeometry).WithMessage("Hình học của khu vực không hợp lệ (MaxX phải lớn hơn MinX và MaxY phải lớn hơn MinY).")
                .Must(HaveValidSize).WithMessage("Diện tích khai báo (Size) không được vượt quá diện tích tối đa của khối hình chữ nhật (Bounding Box).");
        }

        private bool HaveValidGeometry(CreateAreaRequest request)
        {
            if (request.MinX.HasValue && request.MaxX.HasValue && request.MinY.HasValue && request.MaxY.HasValue)
            {
                return request.MaxX.Value > request.MinX.Value && request.MaxY.Value > request.MinY.Value;
            }
            return true; 
        }

        private bool HaveValidSize(CreateAreaRequest request)
        {
            if (request.Size.HasValue && request.MinX.HasValue && request.MaxX.HasValue && request.MinY.HasValue && request.MaxY.HasValue)
            {
                var boundingBoxArea = (request.MaxX.Value - request.MinX.Value) * (request.MaxY.Value - request.MinY.Value);
                // Allow a small margin of error (0.01) for floating point calculations
                return request.Size.Value <= (boundingBoxArea + 0.01);
            }
            return true;
        }
    }
}
