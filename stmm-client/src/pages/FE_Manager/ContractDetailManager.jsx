import { useState, useEffect, useRef } from "react";
import ContractPrintPreview from "./ContractPrintPreview";
import "./ContractDetailManager.css";

const API_BASE = "http://localhost:5056/api/manager/contracts";
const API_UPLOAD = "http://localhost:5056/api/files/upload";


export default function ContractDetailManager({ contractId, navigate, addToast }) {
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Renew states
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewData, setRenewData] = useState({
    startDate: "",
    endDate: "",
    rentFee: "",
    deposit: "",
  });
  const [renewErrors, setRenewErrors] = useState({});

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (contractId) {
      fetchContractDetails();
    }
  }, [contractId]);

  const fetchContractDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${contractId}`);
      if (res.ok) {
        const data = await res.json();
        setContract(data);
        
        // Auto-calculate default renewal dates when contract details load
        if (data.endDate) {
          const oldEndDate = new Date(data.endDate);
          const nextStartDate = new Date(oldEndDate);
          nextStartDate.setDate(nextStartDate.getDate() + 1);
          
          const nextEndDate = new Date(nextStartDate);
          nextEndDate.setFullYear(nextEndDate.getFullYear() + 1); // default 1 year
          
          setRenewData({
            startDate: nextStartDate.toISOString().split("T")[0],
            endDate: nextEndDate.toISOString().split("T")[0],
            rentFee: data.rentFee,
            deposit: data.deposit,
          });
        }
      } else {
        throw new Error();
      }
    } catch {
      addToast("Không thể tải thông tin chi tiết hợp đồng.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return "0";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const handleTerminate = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn CHẤM DỨT hợp đồng này trước thời hạn? Sạp hàng sẽ được trả về trạng thái TRỐNG (Available).")) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${contractId}/terminate`, {
        method: "PUT"
      });

      if (res.ok) {
        addToast("Hợp đồng đã chấm dứt thành công và giải phóng mặt bằng.", "success");
        fetchContractDetails();
      } else {
        const error = await res.json();
        addToast(error.message || "Lỗi khi chấm dứt hợp đồng.", "error");
      }
    } catch {
      addToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const validateRenew = () => {
    const errs = {};
    if (!renewData.startDate) errs.startDate = "Vui lòng chọn ngày bắt đầu.";
    if (!renewData.endDate) errs.endDate = "Vui lòng chọn ngày kết thúc.";
    if (renewData.startDate && renewData.endDate) {
      if (new Date(renewData.startDate) >= new Date(renewData.endDate)) {
        errs.endDate = "Ngày kết thúc phải sau ngày bắt đầu.";
      }
    }
    if (!renewData.rentFee || parseFloat(renewData.rentFee) < 0) {
      errs.rentFee = "Giá thuê không hợp lệ.";
    }
    if (!renewData.deposit || parseFloat(renewData.deposit) < 0) {
      errs.deposit = "Tiền đặt cọc không hợp lệ.";
    }
    setRenewErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    if (!validateRenew()) return;

    setActionLoading(true);
    try {
      const payload = {
        startDate: renewData.startDate,
        endDate: renewData.endDate,
        rentFee: parseFloat(renewData.rentFee),
        deposit: parseFloat(renewData.deposit)
      };

      const res = await fetch(`${API_BASE}/${contractId}/renew`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        addToast("Gia hạn hợp đồng thành công! Hợp đồng mới đã được khởi tạo.", "success");
        setShowRenewModal(false);
        // Navigate to the newly created renewed contract
        navigate("contract-detail", data.contractId);
      } else {
        addToast(data.message || "Lỗi gia hạn hợp đồng.", "error");
      }
    } catch {
      addToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    
    if (file.size > 5 * 1024 * 1024) {
      addToast("Dung lượng file tối đa là 5MB.", "error");
      return;
    }

    setUploadingFile(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      // 1. Upload to Cloudinary via backend api/files/upload
      const uploadRes = await fetch(API_UPLOAD, {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        throw new Error("Upload thất bại.");
      }

      const uploadResult = await uploadRes.json();
      const imageUrl = uploadResult.imageUrl;

      // 2. Save file url to contract_files
      const saveRes = await fetch(`${API_BASE}/${contractId}/files`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fileUrls: [imageUrl] })
      });

      if (saveRes.ok) {
        addToast("Tải bản quét đã ký lên thành công!", "success");
        fetchContractDetails();
      } else {
        throw new Error("Lỗi lưu liên kết bản quét.");
      }
    } catch (err) {
      addToast(err.message || "Lỗi tải ảnh lên máy chủ.", "error");
    } finally {
      setUploadingFile(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <span className="status-badge status-active">Đang hoạt động</span>;
      case "Expired":
        return <span className="status-badge status-expired">Đã hết hạn</span>;
      case "Terminated":
        return <span className="status-badge status-terminated">Đã chấm dứt</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-container animate-fade-in">
        <div className="loading-spinner"></div>
        <span>Đang tải thông tin chi tiết hợp đồng...</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="detail-error-container animate-fade-in">
        <div className="error-icon">⚠️</div>
        <h3>Không tìm thấy hợp đồng</h3>
        <p>Hợp đồng yêu cầu không tồn tại hoặc đã bị xóa mềm.</p>
        <button onClick={() => navigate("contracts")} className="btn-back">Quay lại danh sách</button>
      </div>
    );
  }

  return (
    <div className="contract-detail-manager-container animate-fade-in">
      
      {/* Top action header */}
      <div className="detail-header-actions no-print">
        <button className="btn-back-link" onClick={() => navigate("contracts")}>
          ← Quay lại danh sách
        </button>

        <div className="actions-group">
          {contract.status === "Active" && (
            <>
              <button 
                className="btn-action-terminate" 
                onClick={handleTerminate}
                disabled={actionLoading}
              >
                🚫 Chấm Dứt Trước Hạn
              </button>
              <button 
                className="btn-action-renew" 
                onClick={() => setShowRenewModal(true)}
                disabled={actionLoading}
              >
                🔄 Gia Hạn Hợp Đồng
              </button>
            </>
          )}
          <button className="btn-action-print" onClick={() => setShowPrintPreview(true)}>
            📄 Xuất file PDF (A4)
          </button>

        </div>
      </div>

      {/* Contract Detail Layout */}
      <div className="detail-grid no-print">
        
        {/* Left Column: Details Cards */}
        <div className="detail-main-info">
          
          {/* Card 1: Contract Details */}
          <div className="detail-card">
            <div className="card-header">
              <h3>HỢP ĐỒNG #{String(contract.contractId).padStart(4, "0")}</h3>
              {renderStatusBadge(contract.status)}
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Ngày bắt đầu</span>
                <span className="detail-value">{contract.startDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ngày kết thúc</span>
                <span className="detail-value">{contract.endDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Giá thuê mỗi tháng</span>
                <span className="detail-value highlight-price">{formatCurrency(contract.rentFee)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tiền đặt cọc</span>
                <span className="detail-value">{formatCurrency(contract.deposit)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ngày khởi tạo</span>
                <span className="detail-value">
                  {contract.createdAt ? new Date(contract.createdAt).toLocaleString("vi-VN") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Stall & Location Info */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Thông tin Mặt Bằng (Ki-ốt)</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Mã số quầy sạp</span>
                <span className="detail-value font-monospace-pill">{contract.stallCode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Diện tích</span>
                <span className="detail-value">{contract.stallSize ? `${contract.stallSize} m²` : "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Phân khu (Area)</span>
                <span className="detail-value">{contract.areaName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Khu chợ</span>
                <span className="detail-value">{contract.marketName}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Lessee Info */}
          <div className="detail-card">
            <div className="card-header">
              <h3>Thông tin Khách Thuê (Bên B)</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">Họ và tên đại diện</span>
                <span className="detail-value font-weight-bold">{contract.vendorName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tên Cơ sở Kinh doanh</span>
                <span className="detail-value">{contract.vendorBusinessName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mã số thuế</span>
                <span className="detail-value">{contract.vendorTaxCode || "Chưa cập nhật"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số CCCD/CMND</span>
                <span className="detail-value">{contract.vendorCccd}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số điện thoại</span>
                <span className="detail-value">{contract.vendorPhone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email liên hệ</span>
                <span className="detail-value">{contract.vendorEmail}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Địa chỉ đăng ký KD</span>
                <span className="detail-value">{contract.vendorAddress || "Chưa cập nhật"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số tài khoản ngân hàng</span>
                <span className="detail-value">{contract.vendorBankAccount || "Chưa cập nhật"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Tại ngân hàng</span>
                <span className="detail-value">{contract.vendorBankName || "Chưa cập nhật"}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Uploaded Scan Images */}
        <div className="detail-scans-panel">
          <div className="detail-card full-height">
            <div className="card-header flex-header">
              <h3>Bản Quét Hợp Đồng Đã Ký</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <button 
                className="btn-upload-scan" 
                onClick={handleFileUploadClick}
                disabled={uploadingFile}
              >
                {uploadingFile ? "Đang tải..." : "📁 Tải lên bản quét"}
              </button>
            </div>
            
            <div className="card-content flex-content scrollable">
              {contract.contractFiles.length === 0 ? (
                <div className="scans-empty">
                  <span className="empty-icon">📂</span>
                  <p>Chưa có hình ảnh/bản quét hợp đồng đã ký tên.</p>
                  <p className="empty-sub">Hãy in hợp đồng ra bản cứng, thực hiện ký kết hai bên, quét/chụp ảnh và tải lên đây để lưu trữ.</p>
                </div>
              ) : (
                <div className="scans-grid">
                  {contract.contractFiles.map((file, idx) => (
                    <div key={file.contractFileId} className="scan-image-card">
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" title="Mở hình ảnh đầy đủ">
                        <img src={file.fileUrl} alt={`Bản quét hợp đồng trang ${idx + 1}`} />
                      </a>
                      <span className="scan-image-label">Trang {idx + 1}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RENEW MODAL */}
      {showRenewModal && (
        <div className="modal-overlay-custom no-print">
          <div className="modal-container-custom">
            <div className="modal-header-custom">
              <h3>Gia Hạn Hợp Đồng Thuê</h3>
              <button className="btn-close-modal" onClick={() => setShowRenewModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleRenewSubmit} className="modal-form-custom">
              <div className="modal-form-grid">
                
                <div className="form-group-custom">
                  <label>Ngày bắt đầu gia hạn</label>
                  <input
                    type="date"
                    value={renewData.startDate}
                    onChange={(e) => setRenewData({ ...renewData, startDate: e.target.value })}
                    className={renewErrors.startDate ? "input-error" : ""}
                  />
                  {renewErrors.startDate && <span className="error-txt">{renewErrors.startDate}</span>}
                </div>

                <div className="form-group-custom">
                  <label>Ngày kết thúc gia hạn</label>
                  <input
                    type="date"
                    value={renewData.endDate}
                    onChange={(e) => setRenewData({ ...renewData, endDate: e.target.value })}
                    className={renewErrors.endDate ? "input-error" : ""}
                  />
                  {renewErrors.endDate && <span className="error-txt">{renewErrors.endDate}</span>}
                </div>

                <div className="form-group-custom">
                  <label>Giá thuê mới / tháng (VND)</label>
                  <input
                    type="number"
                    value={renewData.rentFee}
                    onChange={(e) => setRenewData({ ...renewData, rentFee: e.target.value })}
                    className={renewErrors.rentFee ? "input-error" : ""}
                  />
                  {renewErrors.rentFee && <span className="error-txt">{renewErrors.rentFee}</span>}
                </div>

                <div className="form-group-custom">
                  <label>Tiền đặt cọc mới (VND)</label>
                  <input
                    type="number"
                    value={renewData.deposit}
                    onChange={(e) => setRenewData({ ...renewData, deposit: e.target.value })}
                    className={renewErrors.deposit ? "input-error" : ""}
                  />
                  {renewErrors.deposit && <span className="error-txt">{renewErrors.deposit}</span>}
                </div>

              </div>

              <div className="modal-actions-custom">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowRenewModal(false)}
                  disabled={actionLoading}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Đang xử lý..." : "Xác nhận gia hạn"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW OVERLAY */}
      {showPrintPreview && (
        <ContractPrintPreview
          contract={contract}
          onClose={() => setShowPrintPreview(false)}
          onSaveSuccess={fetchContractDetails}
          addToast={addToast}
        />
      )}

    </div>
  );
}
