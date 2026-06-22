namespace STMM.Business.DTOs.Meter
{
    public class MeterReplacementRequest
    {
        public int StallId { get; set; }
        public int OldMeterId { get; set; }
        public int NewMeterId { get; set; }
    }
}
