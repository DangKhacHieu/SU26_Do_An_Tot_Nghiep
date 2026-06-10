import { useState, useEffect } from "react";
import "./ContractFormManager.css";

const API_STALLS = "http://localhost:5056/api/manager/contracts/available-stalls";
const API_VENDORS = "http://localhost:5056/api/manager/contracts/vendors";
const API_CONTRACTS = "http://localhost:5056/api/manager/contracts";


export default function ContractFormManager({ navigate, addToast }) {
  const [stalls, setStalls] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [formData, setFormData] = useState({
    stallId: "",
    userId: "",
    startDate: "",
    endDate: "",
    rentFee: "",
    deposit: "",
    businessName: "",
    taxCode: "",
    bankAccount: "",
    bankName: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadFormDependencies();
  }, []);

  const loadFormDependencies = async () => {
    setLoadingDropdowns(true);
    try {
      const [stallsRes, vendorsRes] = await Promise.all([
        fetch(API_STALLS),
        fetch(API_VENDORS)
      ]);

      if (stallsRes.ok && vendorsRes.ok) {
        setStalls(await stallsRes.json());
        setVendors(await vendorsRes.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast("Không thể tải thông tin danh sách sạp hàng hoặc tiểu thương.", "error");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  // Pre-fill default rent fee if stall size is known (optional logic)
  const handleStallChange = (stallId) => {
    setFormData((prev) => ({ ...prev, stallId }));
    const selectedStall = stalls.find((s) => s.stallId === parseInt(stallId));
    if (selectedStall) {
      // Suggesting a base rent price: e.g. size * 200,000 VND / m2
      const suggestedFee = Math.round((selectedStall.size || 10) * 150000);
      const suggestedDeposit = suggestedFee * 3; // 3 months deposit
      setFormData((prev) => ({
        ...prev,
        stallId,
        rentFee: prev.rentFee || suggestedFee,
        deposit: prev.deposit || suggestedDeposit
      }));
    }
  };

  const handleVendorChange = (userId) => {
    const selectedVendor = vendors.find((v) => v.userId === parseInt(userId));
    setFormData((prev) => ({
      ...prev,
      userId,
      businessName: selectedVendor?.businessName || "",
      taxCode: selectedVendor?.taxCode || "",
      bankAccount: selectedVendor?.bankAccount || "",
      bankName: selectedVendor?.bankName || "",
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.stallId) newErrors.stallId = "Vui lòng chọn sạp hàng.";
    if (!formData.userId) newErrors.userId = "Vui lòng chọn tiểu thương.";
    if (!formData.startDate) newErrors.startDate = "Vui lòng chọn ngày bắt đầu.";
    if (!formData.endDate) newErrors.endDate = "Vui lòng chọn ngày kết thúc.";
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu.";
      }
    }
    if (!formData.rentFee || parseFloat(formData.rentFee) < 0) {
      newErrors.rentFee = "Giá thuê không hợp lệ.";
    }
    if (!formData.deposit || parseFloat(formData.deposit) < 0) {
      newErrors.deposit = "Tiền đặt cọc không hợp lệ.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const payload = {
        stallId: parseInt(formData.stallId),
        userId: parseInt(formData.userId),
        startDate: formData.startDate,
        endDate: formData.endDate,
        rentFee: parseFloat(formData.rentFee),
        deposit: parseFloat(formData.deposit),
        businessName: formData.businessName.trim() || null,
        taxCode: formData.taxCode.trim() || null,
        bankAccount: formData.bankAccount.trim() || null,
        bankName: formData.bankName.trim() || null,
      };

      const res = await fetch(API_CONTRACTS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        addToast("Ký hợp đồng thuê ki-ốt thành công!", "success");
        // Navigate to the details page of the newly created contract
        navigate("contract-detail", data.contractId);
      } else {
        addToast(data.message || "Không thể ký hợp đồng.", "error");
      }
    } catch {
      addToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="contract-form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <h2>Ký Hợp Đồng Thuê Ki-ốt</h2>
          <p>Nhập thông tin thuê mặt bằng kinh doanh cho tiểu thương trong hệ thống.</p>
        </div>

        {loadingDropdowns ? (
          <div className="form-loading">
            <div className="loading-spinner"></div>
            <span>Đang tải thông tin biểu mẫu...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-form">
            <div className="form-grid">
              
              {/* Stall selection */}
              <div className="form-group full-width">
                <label>Sạp hàng còn trống (Available Stalls)</label>
                <select
                  value={formData.stallId}
                  onChange={(e) => handleStallChange(e.target.value)}
                  className={errors.stallId ? "input-error" : ""}
                >
                  <option value="">-- Chọn sạp hàng trống --</option>
                  {stalls.map((s) => (
                    <option key={s.stallId} value={s.stallId}>
                      {s.code} - Khu vực: {s.areaName} ({s.size} m²) - {s.categoryName}
                    </option>
                  ))}
                </select>
                {errors.stallId && <span className="error-txt">{errors.stallId}</span>}
              </div>

              {/* Vendor selection */}
              <div className="form-group full-width">
                <label>Tiểu thương (Vendor Accounts)</label>
                <select
                  value={formData.userId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className={errors.userId ? "input-error" : ""}
                >
                  <option value="">-- Chọn tài khoản tiểu thương --</option>
                  {vendors.map((v) => (
                    <option key={v.userId} value={v.userId}>
                      {v.name} ({v.phone}) - {v.businessName || "Chưa tạo cơ sở KD"} - CCCD: {v.cccd}
                    </option>
                  ))}
                </select>
                {errors.userId && <span className="error-txt">{errors.userId}</span>}
              </div>

              {/* Optional Vendor Business Info */}
              <div className="form-group">
                <label>Tên Cơ sở Kinh doanh (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Cửa hàng Tiện lợi Gia Đình"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Mã số thuế Bên B (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Nhập mã số thuế"
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Số tài khoản ngân hàng Bên B (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Nhập số tài khoản ngân hàng"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tên Ngân hàng Bên B (Không bắt buộc)</label>
                <input
                  type="text"
                  placeholder="Nhập tên ngân hàng và chi nhánh"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>Ngày bắt đầu hợp đồng</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className={errors.startDate ? "input-error" : ""}
                />
                {errors.startDate && <span className="error-txt">{errors.startDate}</span>}
              </div>

              {/* End Date */}
              <div className="form-group">
                <label>Ngày kết thúc hợp đồng</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className={errors.endDate ? "input-error" : ""}
                />
                {errors.endDate && <span className="error-txt">{errors.endDate}</span>}
              </div>

              {/* Rent Fee */}
              <div className="form-group">
                <label>Giá thuê mỗi tháng (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 3000000"
                  value={formData.rentFee}
                  onChange={(e) => setFormData({ ...formData, rentFee: e.target.value })}
                  className={errors.rentFee ? "input-error" : ""}
                />
                {errors.rentFee && <span className="error-txt">{errors.rentFee}</span>}
              </div>

              {/* Deposit */}
              <div className="form-group">
                <label>Tiền đặt cọc thế chân (VND)</label>
                <input
                  type="number"
                  placeholder="Ví dụ: 9000000"
                  value={formData.deposit}
                  onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  className={errors.deposit ? "input-error" : ""}
                />
                {errors.deposit && <span className="error-txt">{errors.deposit}</span>}
              </div>

            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => navigate("contracts")}
                disabled={submitLoading}
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn-submit"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <span className="spinner-small"></span> Đang xử lý...
                  </>
                ) : (
                  "Ký hợp đồng"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
