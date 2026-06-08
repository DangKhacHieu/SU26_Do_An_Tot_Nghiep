namespace STMM.Business.DTOs.Quotation
{
    /// <summary>
    /// Request body khi Staff thêm một dòng vật tư vào báo giá của task.
    /// </summary>
    public class AddMaterialRequest
    {
        /// <summary>
        /// Mã hạng mục giá từ catalog repair_prices. Bắt buộc.
        /// </summary>
        public int RepairPriceId { get; set; }

        /// <summary>
        /// Số lượng thực tế sử dụng. Phải lớn hơn 0.
        /// </summary>
        public double Quantity { get; set; }

        /// <summary>
        /// Đơn giá tự nhập — chỉ bắt buộc khi chọn dòng "Vật tư khác" (repair_prices.price == 0).
        /// Bị bỏ qua nếu vật tư tiêu chuẩn có giá sẵn trong catalog.
        /// </summary>
        public decimal? CustomUnitPrice { get; set; }
    }
}
