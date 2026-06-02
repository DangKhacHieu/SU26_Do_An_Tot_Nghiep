namespace STMM.Business.DTOs.Billing
{
    public class InvoiceDetailDto
    {
        public int InvoiceDetailId { get; set; }
        public int FeeTypeId { get; set; }
        public string FeeTypeName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public double Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
    }
}
