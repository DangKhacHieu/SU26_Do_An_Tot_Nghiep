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
        private readonly IMarketRepository _marketRepository;
        private readonly IAreaRepository _areaRepository;

        public CreateAreaRequestValidator(IMarketRepository marketRepository, IAreaRepository areaRepository)
        {
            _marketRepository = marketRepository;
            _areaRepository = areaRepository;

            RuleFor(x => x.MarketId)
                .GreaterThan(0).WithMessage("Mã chợ (MarketId) không hợp lệ.")
                .MustAsync(MarketExistsAsync).WithMessage("Chợ/TTTM không tồn tại trong hệ thống.");

            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Tên khu vực không được để trống.")
                .MaximumLength(255).WithMessage("Tên khu vực không được vượt quá 255 ký tự.")
                .MustAsync(BeUniqueNameInMarketAsync).WithMessage(x => $"Tên khu vực '{x.Name}' đã tồn tại trong chợ/TTTM này.");

            RuleFor(x => x.CategoryId)
                .GreaterThan(0).When(x => x.CategoryId.HasValue).WithMessage("Mã danh mục không hợp lệ.");

            RuleFor(x => x.CategoryName)
                .MaximumLength(255).When(x => !string.IsNullOrEmpty(x.CategoryName)).WithMessage("Tên danh mục không được vượt quá 255 ký tự.");

            RuleFor(x => x)
                .Must(HaveValidGeometry).WithMessage("Hình học của khu vực không hợp lệ (MaxX phải lớn hơn MinX và MaxY phải lớn hơn MinY).")
                .MustAsync(NotOverlapWithExistingAreasAsync).WithMessage("Khu vực mới bị chồng chéo không gian với một khu vực khác đã có trong chợ/TTTM.")
                .Must(HaveValidSize).WithMessage("Diện tích khai báo (Size) không được vượt quá diện tích tối đa của khối hình chữ nhật (Bounding Box).")
                .MustAsync(NotExceedMarketCapacityAsync).WithMessage("Tổng diện tích các khu vực vượt quá giới hạn diện tích của chợ/TTTM này.");
        }

        private async Task<bool> MarketExistsAsync(int marketId, CancellationToken cancellationToken)
        {
            return await _marketRepository.Query().AnyAsync(m => m.MarketId == marketId, cancellationToken);
        }

        private async Task<bool> BeUniqueNameInMarketAsync(CreateAreaRequest request, string name, CancellationToken cancellationToken)
        {
            if (string.IsNullOrWhiteSpace(name)) return true;

            var isDuplicate = await _areaRepository.Query()
                .AnyAsync(a => a.MarketId == request.MarketId && a.Name.ToLower().Trim() == name.ToLower().Trim() && a.IsDeleted != true, cancellationToken);
            
            return !isDuplicate;
        }

        private bool HaveValidGeometry(CreateAreaRequest request)
        {
            if (request.MinX.HasValue && request.MaxX.HasValue && request.MinY.HasValue && request.MaxY.HasValue)
            {
                return request.MaxX.Value > request.MinX.Value && request.MaxY.Value > request.MinY.Value;
            }
            return true; 
        }

        private async Task<bool> NotOverlapWithExistingAreasAsync(CreateAreaRequest request, CancellationToken cancellationToken)
        {
            if (!request.MinX.HasValue || !request.MaxX.HasValue || !request.MinY.HasValue || !request.MaxY.HasValue)
            {
                return true; 
            }

            var existingAreas = await _areaRepository.Query()
                .Where(a => a.MarketId == request.MarketId && a.IsDeleted != true)
                .ToListAsync(cancellationToken);

            foreach (var area in existingAreas)
            {
                if (area.MinX.HasValue && area.MaxX.HasValue && area.MinY.HasValue && area.MaxY.HasValue)
                {
                    bool isNotOverlapping = 
                        request.MaxX.Value <= area.MinX.Value ||
                        request.MinX.Value >= area.MaxX.Value ||
                        request.MaxY.Value <= area.MinY.Value ||
                        request.MinY.Value >= area.MaxY.Value;

                    if (!isNotOverlapping)
                    {
                        return false; 
                    }
                }
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

        private async Task<bool> NotExceedMarketCapacityAsync(CreateAreaRequest request, CancellationToken cancellationToken)
        {
            if (!request.Size.HasValue) return true;

            var market = await _marketRepository.Query().FirstOrDefaultAsync(m => m.MarketId == request.MarketId, cancellationToken);
            if (market == null || !market.Size.HasValue) return true;

            var totalExistingSize = await _areaRepository.Query()
                .Where(a => a.MarketId == request.MarketId && a.IsDeleted != true)
                .SumAsync(a => a.Size ?? 0, cancellationToken);

            return (totalExistingSize + request.Size.Value) <= market.Size.Value;
        }
    }
}
