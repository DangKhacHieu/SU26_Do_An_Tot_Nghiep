using System;
using System.Collections.Generic;
using System.Linq;
using NetTopologySuite.Geometries;
using STMM.Business.DTOs.Market;

namespace STMM.Business.Services.Grid
{
    public class GridAreaCalculator
    {
        private const double PixelsPerMeter = 30.0;
        private const double PixelsPerSquareMeter = PixelsPerMeter * PixelsPerMeter; // 900

        public double CalculatePolygonAreaPixels(Polygon polygon)
        {
            if (polygon == null || polygon.IsEmpty) return 0;
            return polygon.Area;
        }

        public double CalculatePolygonAreaM2(Polygon polygon)
        {
            return CalculatePolygonAreaPixels(polygon) / PixelsPerSquareMeter;
        }

        public Polygon CreatePolygonFromPoints(List<double[]> points)
        {
            if (points == null || points.Count < 3) return null;

            var coordinates = points.Select(p => new Coordinate(p[0], p[1])).ToList();
            
            // Ensure closed polygon
            if (!coordinates.First().Equals2D(coordinates.Last()))
            {
                coordinates.Add(coordinates.First().Copy());
            }

            var geometryFactory = new GeometryFactory();
            return geometryFactory.CreatePolygon(coordinates.ToArray());
        }

        public double GetUsableArea(double totalAreaM2, int rows, int cols, double aisleWidthPixels, Polygon marketPolygon)
        {
            // Calculate a rough usable area estimation or exactly by doing the diffs.
            // A more exact way is just to let the generator generate and sum the areas of the cells.
            return 0; 
        }
    }
}
