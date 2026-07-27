using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FluentValidation;
using STMM.Business.DTOs.Market;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using STMM.DataAccess.IRepositories;

namespace STMM.Business.Validators
{
    public class CreateMarketBulkRequestValidator : AbstractValidator<CreateMarketBulkRequest>
    {
        public CreateMarketBulkRequestValidator()
        {
            RuleFor(x => x.MarketName)
                .NotEmpty().WithMessage("Tên chợ không được để trống.")
                .MaximumLength(255).WithMessage("Tên chợ không được vượt quá 255 ký tự.");

            RuleFor(x => x)
                .Must(HaveValidMarketCanvas).WithMessage("Kích thước Canvas bản đồ (Tọa độ Pixel MaxX-MinX, MaxY-MinY) không hợp lệ hoặc quá nhỏ.");

            // Validate Areas
            RuleFor(x => x.Areas)
                .NotEmpty().WithMessage("Phải có ít nhất một khu vực trong chợ.")
                .Must(HaveUniqueAreaNames).WithMessage("Tên khu vực không được trùng lặp bên trong cùng một chợ.")
                .Must(AreasFitInMarketCanvas).WithMessage("Khu vực (Area) bị vẽ vượt ra ngoài giới hạn khung Canvas của Chợ.")
                .Must(AreasNotOverlap).WithMessage("Có các Khu vực (Areas) bị vẽ chồng chéo không gian lên nhau.")
                .Must(AreasSizeNotExceedMarket).WithMessage("Tổng diện tích các khu vực vượt quá giới hạn diện tích (Capacity) của Chợ.");

            // Validate Stalls
            RuleFor(x => x.Areas)
                .Must(HaveUniqueStallCodes).WithMessage("Mã sạp (Code) không được trùng lặp trên toàn bộ các khu vực của chợ.")
                .Must(StallsFitInAreaCanvas).WithMessage("Tọa độ của một số Sạp (Stalls) bị vẽ vượt ra ngoài giới hạn không gian của Khu vực (Area) chứa nó.")
                .Must(StallsNotOverlap).WithMessage("Có các Sạp bị vẽ chồng chéo không gian lên nhau.")
                .Must(StallsSizeNotExceedArea).WithMessage("Tổng diện tích các Sạp trong một khu vực vượt quá diện tích của khu vực đó.");
        }

        private bool HaveValidMarketCanvas(CreateMarketBulkRequest request)
        {
            if (request.MinX.HasValue && request.MaxX.HasValue && request.MinY.HasValue && request.MaxY.HasValue)
            {
                return (request.MaxX.Value - request.MinX.Value) > 0 && (request.MaxY.Value - request.MinY.Value) > 0;
            }
            return true; 
        }

        private bool HaveUniqueAreaNames(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;
            var names = areas.Select(a => a.Name?.ToLower()?.Trim()).Where(n => !string.IsNullOrEmpty(n)).ToList();
            return names.Count == names.Distinct().Count();
        }

        private bool AreasFitInMarketCanvas(CreateMarketBulkRequest request, System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null || !request.MinX.HasValue || !request.MaxX.HasValue || !request.MinY.HasValue || !request.MaxY.HasValue) return true;

            foreach (var area in areas)
            {
                if (area.MinX.HasValue && area.MaxX.HasValue && area.MinY.HasValue && area.MaxY.HasValue)
                {
                    if (area.MinX.Value < request.MinX.Value || area.MaxX.Value > request.MaxX.Value ||
                        area.MinY.Value < request.MinY.Value || area.MaxY.Value > request.MaxY.Value)
                    {
                        return false;
                    }
                }
            }
            return true;
        }

        private bool AreasNotOverlap(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;

            var validAreas = areas.Where(a => a.MinX.HasValue && a.MaxX.HasValue && a.MinY.HasValue && a.MaxY.HasValue).ToList();
            for (int i = 0; i < validAreas.Count; i++)
            {
                for (int j = i + 1; j < validAreas.Count; j++)
                {
                    var a1 = validAreas[i];
                    var a2 = validAreas[j];

                    bool isNotOverlapping = 
                        a1.MaxX.Value <= a2.MinX.Value ||
                        a1.MinX.Value >= a2.MaxX.Value ||
                        a1.MaxY.Value <= a2.MinY.Value ||
                        a1.MinY.Value >= a2.MaxY.Value;

                    if (!isNotOverlapping) return false;
                }
            }
            return true;
        }

        private bool AreasSizeNotExceedMarket(CreateMarketBulkRequest request, System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null || !request.Size.HasValue) return true;
            var totalAreaSize = areas.Sum(a => a.Size ?? 0);
            return totalAreaSize <= request.Size.Value + 0.01;
        }

        private bool HaveUniqueStallCodes(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;
            var allStallCodes = areas.Where(a => a.Stalls != null)
                                     .SelectMany(a => a.Stalls)
                                     .Select(s => s.Code?.ToLower()?.Trim())
                                     .Where(c => !string.IsNullOrEmpty(c))
                                     .ToList();
            return allStallCodes.Count == allStallCodes.Distinct().Count();
        }

        private bool StallsFitInAreaCanvas(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;
            foreach (var area in areas)
            {
                if (area.Stalls == null || !area.MinX.HasValue || !area.MaxX.HasValue || !area.MinY.HasValue || !area.MaxY.HasValue) continue;

                var areaWidth = area.MaxX.Value - area.MinX.Value;
                var areaHeight = area.MaxY.Value - area.MinY.Value;

                foreach (var stall in area.Stalls)
                {
                    if (stall.MapX.HasValue && stall.MapY.HasValue && stall.Width.HasValue && stall.Height.HasValue)
                    {
                        var stallMinX = stall.MapX.Value;
                        var stallMaxX = stall.MapX.Value + stall.Width.Value;
                        var stallMinY = stall.MapY.Value;
                        var stallMaxY = stall.MapY.Value + stall.Height.Value;

                        bool fitsRelative = (stallMinX >= -1 && stallMaxX <= areaWidth + 1 && stallMinY >= -1 && stallMaxY <= areaHeight + 1);
                        bool fitsAbsolute = (stallMinX >= area.MinX.Value - 1 && stallMaxX <= area.MaxX.Value + 1 && stallMinY >= area.MinY.Value - 1 && stallMaxY <= area.MaxY.Value + 1);

                        if (!fitsRelative && !fitsAbsolute)
                        {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        private bool StallsNotOverlap(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;

            foreach (var area in areas)
            {
                if (area.Stalls == null) continue;
                var validStalls = area.Stalls.Where(s => s.MapX.HasValue && s.MapY.HasValue && s.Width.HasValue && s.Height.HasValue).ToList();
                for (int i = 0; i < validStalls.Count; i++)
                {
                    for (int j = i + 1; j < validStalls.Count; j++)
                    {
                        var s1 = validStalls[i];
                        var s2 = validStalls[j];

                        var s1MinX = s1.MapX.Value;
                        var s1MaxX = s1.MapX.Value + s1.Width.Value;
                        var s1MinY = s1.MapY.Value;
                        var s1MaxY = s1.MapY.Value + s1.Height.Value;

                        var s2MinX = s2.MapX.Value;
                        var s2MaxX = s2.MapX.Value + s2.Width.Value;
                        var s2MinY = s2.MapY.Value;
                        var s2MaxY = s2.MapY.Value + s2.Height.Value;

                        bool isNotOverlapping = 
                            s1MaxX <= s2MinX ||
                            s1MinX >= s2MaxX ||
                            s1MaxY <= s2MinY ||
                            s1MinY >= s2MaxY;

                        if (!isNotOverlapping) return false;
                    }
                }
            }
            return true;
        }

        private bool StallsSizeNotExceedArea(System.Collections.Generic.List<CreateAreaBulkRequest> areas)
        {
            if (areas == null) return true;
            foreach (var area in areas)
            {
                if (area.Size.HasValue && area.Stalls != null)
                {
                    var totalStallSize = area.Stalls.Sum(s => s.Size ?? 0);
                    if (totalStallSize > area.Size.Value + 0.01) return false;
                }
            }
            return true;
        }
    }
}
