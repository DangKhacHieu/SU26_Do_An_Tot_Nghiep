namespace STMM.Business.DTOs.Task
{
    public class TaskMaterialDto
    {
        public int Id { get; set; }
        public int RepairPriceId { get; set; }
        public string ItemName { get; set; } = null!;
        public double Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Amount { get; set; }
    }
}
