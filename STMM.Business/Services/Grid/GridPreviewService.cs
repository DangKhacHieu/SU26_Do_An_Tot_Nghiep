using System;
using System.Linq;
using STMM.Business.DTOs.Market;
using NetTopologySuite.Geometries;

namespace STMM.Business.Services.Grid
{
    public interface IGridPreviewService
    {
        GridPreviewResponse GeneratePreview(GridPreviewRequest request);
    }

    public class GridPreviewService : IGridPreviewService
    {
        private readonly GridAreaCalculator _calculator;
        private readonly GridValidator _validator;
        private readonly GridGenerator _generator;

        public GridPreviewService()
        {
            _calculator = new GridAreaCalculator();
            _validator = new GridValidator();
            _generator = new GridGenerator();
        }

        public GridPreviewResponse GeneratePreview(GridPreviewRequest request)
        {
            var response = new GridPreviewResponse
            {
                Rows = request.Rows,
                Cols = request.Cols,
                TotalCells = request.Rows * request.Cols
            };

            var polygon = _calculator.CreatePolygonFromPoints(request.PolygonPoints);
            if (polygon == null)
            {
                response.IsValid = false;
                response.ErrorMessage = "Polygon không hợp lệ.";
                return response;
            }

            double totalAreaM2 = _calculator.CalculatePolygonAreaM2(polygon);
            response.TotalAreaM2 = Math.Round(totalAreaM2, 2);

            var validation = _validator.ValidateConfiguration(request, totalAreaM2);
            response.MaxAllowedZones = validation.maxAllowed;

            if (!validation.isValid)
            {
                response.IsValid = false;
                response.ErrorMessage = validation.errorMessage;
                return response;
            }

            var zones = _generator.GenerateGrid(request, polygon);
            
            response.Zones = zones;
            response.GeneratedZones = zones.Count;
            
            double usableAreaM2 = zones.Sum(z => z.AreaM2);
            response.UsableAreaM2 = Math.Round(usableAreaM2, 2);
            response.AisleAreaM2 = Math.Round(totalAreaM2 - usableAreaM2, 2);
            
            if (zones.Count > 0)
            {
                response.AverageZoneAreaM2 = Math.Round(usableAreaM2 / zones.Count, 2);
            }

            response.IsValid = true;
            return response;
        }
    }
}
