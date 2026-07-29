using System;
using System.Collections.Generic;
using System.Linq;
using NetTopologySuite.Geometries;
using STMM.Business.DTOs.Market;

namespace STMM.Business.Services.Grid
{
    public class GridGenerator
    {
        private readonly GridAreaCalculator _areaCalculator;
        private readonly GeometryFactory _geometryFactory;

        public GridGenerator()
        {
            _areaCalculator = new GridAreaCalculator();
            _geometryFactory = new GeometryFactory();
        }

        public List<PreviewZoneDto> GenerateGrid(GridPreviewRequest request, Polygon marketPolygon)
        {
            var zones = new List<PreviewZoneDto>();
            if (marketPolygon == null || marketPolygon.IsEmpty) return zones;

            var envelope = marketPolygon.EnvelopeInternal;
            double width = envelope.MaxX - envelope.MinX;
            double height = envelope.MaxY - envelope.MinY;

            int rows = request.Rows;
            int cols = request.Cols;
            double gap = request.AisleWidthPixels;

            double areaWidth = Math.Max(10, (width - (cols + 1) * gap) / cols);
            double areaHeight = Math.Max(10, (height - (rows + 1) * gap) / rows);

            // Determine traversal based on start point and order
            bool startTop = request.StartPoint == "TopLeft" || request.StartPoint == "TopRight";
            bool startLeft = request.StartPoint == "TopLeft" || request.StartPoint == "BottomLeft";
            bool rowMajor = request.OrderStrategy == "RowMajor";

            int namingIndex = 0;

            var sequence = GenerateSequence(rows, cols, startTop, startLeft, rowMajor);

            foreach (var pos in sequence)
            {
                int r = pos.r;
                int c = pos.c;

                double x = envelope.MinX + gap + c * (areaWidth + gap);
                double y = envelope.MinY + gap + r * (areaHeight + gap);

                var rectCoords = new Coordinate[]
                {
                    new Coordinate(x, y),
                    new Coordinate(x + areaWidth, y),
                    new Coordinate(x + areaWidth, y + areaHeight),
                    new Coordinate(x, y + areaHeight),
                    new Coordinate(x, y)
                };

                var cellPoly = _geometryFactory.CreatePolygon(rectCoords);
                
                try
                {
                    var intersection = marketPolygon.Intersection(cellPoly);
                    if (intersection != null && !intersection.IsEmpty)
                    {
                        // Intersection could be a MultiPolygon if the market shape is complex (e.g. U-shape)
                        // We will just pick the largest polygon if it's a GeometryCollection/MultiPolygon,
                        // or just use it if it's a Polygon.
                        Polygon resultingPoly = null;

                        if (intersection is Polygon poly)
                        {
                            resultingPoly = poly;
                        }
                        else if (intersection is MultiPolygon multiPoly)
                        {
                            double maxArea = -1;
                            foreach (Polygon p in multiPoly.Geometries)
                            {
                                if (p.Area > maxArea)
                                {
                                    maxArea = p.Area;
                                    resultingPoly = p;
                                }
                            }
                        }

                        if (resultingPoly != null)
                        {
                            double areaM2 = _areaCalculator.CalculatePolygonAreaM2(resultingPoly);
                            if (areaM2 >= 0.1) // Don't add tiny slivers (less than 0.1 m2)
                            {
                                string name = GenerateName(request.NamingStrategy, request.Prefix, namingIndex);
                                namingIndex++;

                                var zoneDto = new PreviewZoneDto
                                {
                                    Name = name,
                                    AreaM2 = Math.Round(areaM2, 2),
                                    Polygon = resultingPoly.Coordinates.Select(coord => new double[] { coord.X, coord.Y }).ToList()
                                };
                                zones.Add(zoneDto);
                            }
                        }
                    }
                }
                catch (Exception)
                {
                    // Ignore topology exceptions for individual cells and move on
                }
            }

            return zones;
        }

        private List<(int r, int c)> GenerateSequence(int rows, int cols, bool startTop, bool startLeft, bool rowMajor)
        {
            var sequence = new List<(int, int)>();
            
            var rRange = startTop ? Enumerable.Range(0, rows) : Enumerable.Range(0, rows).Reverse();
            var cRange = startLeft ? Enumerable.Range(0, cols) : Enumerable.Range(0, cols).Reverse();

            if (rowMajor)
            {
                foreach (var r in rRange)
                {
                    foreach (var c in cRange)
                    {
                        sequence.Add((r, c));
                    }
                }
            }
            else
            {
                foreach (var c in cRange)
                {
                    foreach (var r in rRange)
                    {
                        sequence.Add((r, c));
                    }
                }
            }

            return sequence;
        }

        private string GenerateName(string namingStrategy, string prefix, int index)
        {
            string basePrefix = string.IsNullOrWhiteSpace(prefix) ? "" : $"{prefix.Trim()} ";
            
            if (namingStrategy == "Numeric")
            {
                // Khu 1, Khu 2...
                return $"{basePrefix}{index + 1}";
            }
            else if (namingStrategy == "AlphaNumeric")
            {
                // A1, A2... or A1, B1... depending on row/col, but since we flattened it,
                // normally AlphaNumeric is prefix A1, A2, etc. Wait, the user asked for A1, A2.
                return $"{basePrefix}A{index + 1}"; 
                // We could implement better grid-based alphanumeric but the requirement is simple.
            }
            else // Alphabetic A, B, C... Z, AA, AB
            {
                return $"{basePrefix}{GetAlphabet(index)}";
            }
        }

        private string GetAlphabet(int index)
        {
            string result = "";
            int temp = index;
            while (temp >= 0)
            {
                result = (char)('A' + (temp % 26)) + result;
                temp = (temp / 26) - 1;
            }
            return result;
        }
    }
}
