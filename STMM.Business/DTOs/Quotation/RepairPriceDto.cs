namespace STMM.Business.DTOs.Quotation
{
    /// <summary>
    /// Hạng mục giá vật tư từ catalog repair_prices.
    /// Dùng cho Staff chọn vật tư khi lập báo giá.
    /// </summary>
    public class RepairPriceDto
    {
        /// <summary>Mã hạng mục giá (repair_prices.repair_price_id).</summary>
        public int RepairPriceId { get; set; }

        /// <summary>
        /// Tên vật tư/thiết bị. Dòng đặc biệt "Vật tư khác" dùng khi vật tư không có trong catalog
        /// — Staff sẽ tự nhập đơn giá qua trường CustomUnitPrice.
        /// </summary>
        public string ItemName { get; set; } = string.Empty;

        /// <summary>Đơn vị tính (Cái, Mét, Bộ, Công...).</summary>
        public string Unit { get; set; } = string.Empty;

        /// <summary>
        /// Đơn giá áp dụng (VNĐ). Bằng 0 nếu là dòng "Vật tư khác" — Staff phải nhập CustomUnitPrice.
        /// </summary>
        public decimal Price { get; set; }

        /// <summary>Mô tả chi tiết quy cách vật tư (nullable).</summary>
        public string? Description { get; set; }
    }
}
