namespace STMM.Business.DTOs.Quotation
{
    /// <summary>
    /// Một dòng vật tư trong báo giá sửa chữa của task.
    /// </summary>
    public class MaterialLineDto
    {
        /// <summary>Mã dòng vật tư (task_materials.id).</summary>
        public int Id { get; set; }

        /// <summary>Mã hạng mục giá tham chiếu (repair_prices.id).</summary>
        public int RepairPriceId { get; set; }

        /// <summary>Tên vật tư — snapshot tại thời điểm chọn để tránh mất dữ liệu khi catalog thay đổi.</summary>
        public string ItemName { get; set; } = string.Empty;

        /// <summary>Đơn vị tính (Cái, Mét, Bộ...).</summary>
        public string Unit { get; set; } = string.Empty;

        /// <summary>Số lượng thực tế sử dụng.</summary>
        public double Quantity { get; set; }

        /// <summary>Đơn giá áp dụng (VNĐ).</summary>
        public decimal UnitPrice { get; set; }

        /// <summary>Thành tiền = Quantity × UnitPrice.</summary>
        public decimal Amount { get; set; }
    }
}
