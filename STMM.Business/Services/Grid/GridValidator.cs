using System;
using STMM.Business.DTOs.Market;

namespace STMM.Business.Services.Grid
{
    public class GridValidator
    {
        public const double MIN_ZONE_AREA_M2 = 1.0; // Minimum allowed zone size is 1 m2

        public (bool isValid, string? errorMessage, int maxAllowed) ValidateConfiguration(GridPreviewRequest request, double totalAreaM2)
        {
            if (request.Rows <= 0 || request.Cols <= 0)
            {
                return (false, "Số dòng và số cột phải lớn hơn 0.", 0);
            }

            if (request.AisleWidthPixels < 0)
            {
                return (false, "Độ rộng lối đi không được âm.", 0);
            }

            // Estimate total aisle area and usable area
            // 900 px2 = 1 m2. 30px = 1m.
            // This is a rough estimation. The exact area will be calculated by Generator.
            
            int totalRequestedCells = request.Rows * request.Cols;
            
            // If totalAreaM2 is too small even for 1 cell of MIN_ZONE_AREA_M2
            int maxAllowed = (int)Math.Floor(totalAreaM2 / MIN_ZONE_AREA_M2);

            if (maxAllowed < 1)
            {
                return (false, "Diện tích thực tế của đa giác quá nhỏ để phân lô.", maxAllowed);
            }

            if (totalRequestedCells > maxAllowed)
            {
                return (false, $"Vượt giới hạn. Với diện tích hiện tại, chỉ có thể tạo tối đa {maxAllowed} khu vực.", maxAllowed);
            }

            return (true, null, maxAllowed);
        }
    }
}
