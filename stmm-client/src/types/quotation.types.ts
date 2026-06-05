// ─── Repair Price Catalog ─────────────────────────────────────────────────────

/** Hạng mục giá vật tư từ catalog repair_prices. */
export interface RepairPriceDto {
  repairPriceId: number;
  /** Dòng đặc biệt "Vật tư khác" dùng khi vật tư không có trong catalog. */
  itemName: string;
  unit: string;
  /** 0 nếu là "Vật tư khác" — Staff phải cung cấp customUnitPrice. */
  price: number;
  description: string | null;
}

// ─── Quotation Material Lines ─────────────────────────────────────────────────

/** Một dòng vật tư trong báo giá của task. */
export interface MaterialLineDto {
  id: number;
  repairPriceId: number;
  /** Snapshot tên vật tư tại thời điểm chọn. */
  itemName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  /** = quantity × unitPrice */
  amount: number;
}

/** Tóm tắt báo giá task: danh sách vật tư + tổng tiền. */
export interface QuotationSummaryDto {
  taskId: number;
  taskStatus: string;
  materials: MaterialLineDto[];
  totalAmount: number;
}

// ─── Requests ─────────────────────────────────────────────────────────────────

/** Request body khi Staff thêm một dòng vật tư vào báo giá. */
export interface AddMaterialRequest {
  repairPriceId: number;
  /** Phải lớn hơn 0. */
  quantity: number;
  /**
   * Chỉ bắt buộc khi repairPrice.price === 0 ("Vật tư khác").
   * Bị bỏ qua nếu vật tư tiêu chuẩn đã có giá trong catalog.
   */
  customUnitPrice?: number;
}
