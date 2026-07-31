import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from "react";
import ContractPrintPreview from "./ContractPrintPreview";
import "./ContractDetailManager.css";

const API_BASE = "http://localhost:5056/api/manager/contracts";

const getAuthHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
});

export default function ContractDetailManager({ contractId, navigate, addToast }) {
  const { t } = useTranslation();

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
      const res = await fetch(`${API_BASE}/${contractId}`, {
        headers: getAuthHeaders()
      });
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
    if (!window.confirm(t('contractdetailmanager.are_you_sure_you'))) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${contractId}/terminate`, {
        method: "PUT",
        headers: getAuthHeaders()
      });

      if (res.ok) {
        addToast("Hợp đồng đã chấm dứt thành công và giải phóng mặt bằng.", "success");
        fetchContractDetails();
      } else {
        const error = await res.json();
        addToast(error.message || t('contractdetailmanager.error_when_terminating_the'), "error");
      }
    } catch {
      addToast("Lỗi kết nối máy chủ.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const validateRenew = () => {
    const errs = {};
    if (!renewData.startDate) errs.startDate = t('contractdetailmanager.please_select_a_start');
    if (!renewData.endDate) errs.endDate = t('contractdetailmanager.please_select_an_end');
    if (renewData.startDate && renewData.endDate) {
      if (new Date(renewData.startDate) >= new Date(renewData.endDate)) {
        errs.endDate = t('contractdetailmanager.the_end_date_must');
      }
    }
    if (!renewData.rentFee || parseFloat(renewData.rentFee) < 0) {
      errs.rentFee = t('contractdetailmanager.invalid_rental_price');
    }
    if (!renewData.deposit || parseFloat(renewData.deposit) < 0) {
      errs.deposit = t('contractdetailmanager.invalid_deposit');
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
          "Content-Type": "application/json",
          ...getAuthHeaders()
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
        addToast(data.message || t('contractdetailmanager.contract_renewal_error'), "error");
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
    formData.append("files", file);

    try {
      const saveRes = await fetch(`${API_BASE}/${contractId}/files`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (saveRes.ok) {
        addToast("Tải bản quét đã ký lên thành công!", "success");
        fetchContractDetails();
      } else {
        throw new Error(t('contractdetailmanager.upload_failed'));
      }
    } catch (err) {
      addToast(err.message || t('contractdetailmanager.error_uploading_photos_to'), "error");
    } finally {
      setUploadingFile(false);
      if (e.target) e.target.value = '';
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return <span className="status-badge status-active">{t('contractdetailmanager.active')}</span>;
      case "Expired":
        return <span className="status-badge status-expired">{t('contractdetailmanager.expired')}</span>;
      case "Terminated":
        return <span className="status-badge status-terminated">{t('contractdetailmanager.terminated')}</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="detail-loading-container animate-fade-in">
        <div className="loading-spinner"></div>
        <span>{t('contractdetailmanager.loading_contract_details')}</span>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="detail-error-container animate-fade-in">
        <div className="error-icon">⚠️</div>
        <h3>{t('contractdetailmanager.no_contract_found')}</h3>
        <p>{t('contractdetailmanager.the_required_contract_does')}</p>
        <button onClick={() => navigate("contracts")} className="btn-back">{t('contractdetailmanager.back_to_the_list')}</button>
      </div>
    );
  }

  return (
    <div className="contract-detail-manager-container animate-fade-in">
      
      {/* Top action header */}
      <div className="detail-header-actions no-print">
        <button className="btn-back-link" onClick={() => navigate("contracts")}>
          {t('contractdetailmanager.back_to_list')}</button>

        <div className="actions-group">
          {contract.status === "Active" && (
            <>
              <button 
                className="btn-action-terminate" 
                onClick={handleTerminate}
                disabled={actionLoading}
              >
                {t('contractdetailmanager.chm_dt_trc_hn')}</button>
              <button 
                className="btn-action-renew" 
                onClick={() => setShowRenewModal(true)}
                disabled={actionLoading}
              >
                {t('contractdetailmanager.contract_renewal')}</button>
            </>
          )}
          <button className="btn-action-print" onClick={() => setShowPrintPreview(true)}>
            {t('contractdetailmanager.export_pdf_file_a4')}</button>

        </div>
      </div>

      {/* Contract Detail Layout */}
      <div className="detail-grid no-print">
        
        {/* Left Column: Details Cards */}
        <div className="detail-main-info">
          
          {/* Card 1: Contract Details */}
          <div className="detail-card">
            <div className="card-header">
              <h3>HỢP ĐỒNG {contract.contractId}</h3>
              {renderStatusBadge(contract.status)}
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.start_date')}</span>
                <span className="detail-value">{contract.startDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.end_date')}</span>
                <span className="detail-value">{contract.endDate}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.rental_price_per_month')}</span>
                <span className="detail-value highlight-price">{formatCurrency(contract.rentFee)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.deposit')}</span>
                <span className="detail-value">{formatCurrency(contract.deposit)}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.initialization_date')}</span>
                <span className="detail-value">
                  {contract.createdAt ? new Date(contract.createdAt).toLocaleString("vi-VN") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Stall & Location Info */}
          <div className="detail-card">
            <div className="card-header">
              <h3>{t('contractdetailmanager.floor_information_kiosk')}</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.stall_code')}</span>
                <span className="detail-value font-monospace-pill">{contract.stallCode}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.acreage')}</span>
                <span className="detail-value">{contract.stallSize ? `${contract.stallSize} m²` : "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.area')}</span>
                <span className="detail-value">{contract.areaName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.market_area')}</span>
                <span className="detail-value">{contract.marketName}</span>
              </div>
            </div>
          </div>

          {/* Card 3: Lessee Info */}
          <div className="detail-card">
            <div className="card-header">
              <h3>{t('contractdetailmanager.tenant_information_party_b')}</h3>
            </div>
            <div className="card-content">
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.representative_name_and_surname')}</span>
                <span className="detail-value font-weight-bold">{contract.vendorName}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.name_of_business_establishment')}</span>
                <span className="detail-value">{contract.vendorBusinessName || "N/A"}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.tax_code')}</span>
                <span className="detail-value">{contract.vendorTaxCode || t('contractdetailmanager.not_updated_yet')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.cccdid_card_number')}</span>
                <span className="detail-value">{contract.vendorCccd}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.phone_number')}</span>
                <span className="detail-value">{contract.vendorPhone}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.contact_email')}</span>
                <span className="detail-value">{contract.vendorEmail}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.business_registration_address')}</span>
                <span className="detail-value">{contract.vendorAddress || t('contractdetailmanager.not_updated_yet')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.bank_account_number')}</span>
                <span className="detail-value">{contract.vendorBankAccount || t('contractdetailmanager.not_updated_yet')}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">{t('contractdetailmanager.at_the_bank')}</span>
                <span className="detail-value">{contract.vendorBankName || t('contractdetailmanager.not_updated_yet')}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Uploaded Scan Images */}
        <div className="detail-scans-panel">
          <div className="detail-card full-height">
            <div className="card-header flex-header">
              <h3>{t('contractdetailmanager.scan_of_signed_contract')}</h3>
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
                {uploadingFile ? t('contractdetailmanager.loading') : t('contractdetailmanager.upload_a_scan')}
              </button>
            </div>
            
            <div className="card-content flex-content scrollable">
              {contract.contractFiles.length === 0 ? (
                <div className="scans-empty">
                  <span className="empty-icon">📂</span>
                  <p>{t('contractdetailmanager.there_are_no_picturesscans')}</p>
                  <p className="empty-sub">{t('contractdetailmanager.please_print_the_contract')}</p>
                </div>
              ) : (
                <div className="scans-grid">
                  {contract.contractFiles.map((file, idx) => (
                    <div key={file.contractFileId} className="scan-image-card">
                      <a href={file.fileUrl} target="_blank" rel="noopener noreferrer" title={t('contractdetailmanager.open_the_full_image')}>
                        <img src={file.fileUrl} alt={t('contractdetailmanager.scan_of_contract_page')} />
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
              <h3>{t('contractdetailmanager.lease_renewal')}</h3>
              <button className="btn-close-modal" onClick={() => setShowRenewModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleRenewSubmit} className="modal-form-custom">
              <div className="modal-form-grid">
                
                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.renewal_start_date')}</label>
                  <input
                    type="date"
                    value={renewData.startDate}
                    onChange={(e) => setRenewData({ ...renewData, startDate: e.target.value })}
                    className={renewErrors.startDate ? "input-error" : ""}
                  />
                  {renewErrors.startDate && <span className="error-txt">{renewErrors.startDate}</span>}
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.extension_end_date')}</label>
                  <input
                    type="date"
                    value={renewData.endDate}
                    onChange={(e) => setRenewData({ ...renewData, endDate: e.target.value })}
                    className={renewErrors.endDate ? "input-error" : ""}
                  />
                  {renewErrors.endDate && <span className="error-txt">{renewErrors.endDate}</span>}
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.new_rental_price_month')}</label>
                  <input
                    type="number"
                    value={renewData.rentFee}
                    onChange={(e) => setRenewData({ ...renewData, rentFee: e.target.value })}
                    className={renewErrors.rentFee ? "input-error" : ""}
                  />
                  {renewErrors.rentFee && <span className="error-txt">{renewErrors.rentFee}</span>}
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.new_deposit_vnd')}</label>
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
                  {t('contractdetailmanager.cancel')}</button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('contractdetailmanager.processing') : t('contractdetailmanager.confirm_extension')}
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
