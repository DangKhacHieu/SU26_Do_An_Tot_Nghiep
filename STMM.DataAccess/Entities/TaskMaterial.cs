using System;
using System.Collections.Generic;

namespace STMM.DataAccess.Entities;

/// <summary>
/// Vật tư sử dụng cho các tác vụ
/// </summary>
public partial class TaskMaterial
{
    /// <summary>
    /// Mã bản ghi vật tư sử dụng
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Thuộc tác vụ nào (FK → tasks)
    /// </summary>
    public int TaskId { get; set; }

    /// <summary>
    /// Hạng mục giá được chọn (FK → repair_prices). Bắt buộc — dùng dòng &quot;Vật tư khác&quot; nếu vật tư ngoài danh mục
    /// </summary>
    public int RepairPriceId { get; set; }

    /// <summary>
    /// Tên vật tư — copy từ repair_prices.item_name lúc chọn (tránh mất dữ liệu khi danh mục thay đổi)
    /// </summary>
    public string ItemName { get; set; } = null!;

    /// <summary>
    /// Số lượng thực tế đã sử dụng
    /// </summary>
    public double Quantity { get; set; }

    /// <summary>
    /// Đơn giá — copy từ repair_prices.price. Staff override nếu là dòng &quot;Vật tư khác&quot;
    /// </summary>
    public decimal UnitPrice { get; set; }

    /// <summary>
    /// Thành tiền = quantity × unit_price
    /// </summary>
    public decimal Amount { get; set; }

    public virtual RepairPrice RepairPrice { get; set; } = null!;

    public virtual Task Task { get; set; } = null!;
}
