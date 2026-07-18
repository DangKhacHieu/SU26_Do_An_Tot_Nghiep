using System.ComponentModel.DataAnnotations;

namespace STMM.Business.DTOs.Stall
{
    public class UpdateStallLocationDto
    {
        public double? MapX { get; set; }
        public double? MapY { get; set; }
        public double? Width { get; set; }
        public double? Height { get; set; }
        public double? Rotation { get; set; }
        public double? Size { get; set; }
    }
}
