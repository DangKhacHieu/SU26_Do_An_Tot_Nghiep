import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from "react";
import ContractPrintPreview from "./ContractPrintPreview";
import "./ContractDetailManager.css";

const API_BASE = `${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/manager/contracts`;

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

  // Terminate states
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split("T")[0]);

  // File upload states
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);

  // Edit Vendor Info states
  const [showEditVendorModal, setShowEditVendorModal] = useState(false);
  const [editVendorData, setEditVendorData] = useState({
    businessName: "",
    taxCode: "",
    bankAccount: "",
    bankName: "",
    address: "",
  });

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
        setEditVendorData({
          businessName: data.vendorBusinessName || "",
          taxCode: data.vendorTaxCode || "",
          bankAccount: data.vendorBankAccount || "",
          bankName: data.vendorBankName || "",
          address: data.vendorAddress || "",
        });
      } else {
        throw new Error();
      }
    } catch {
      addToast(t('contractdetailmanager.unable_to_load_contract_details'), "error");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    if (!val) return "0";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val);
  };

  const handleTerminateSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${contractId}/terminate?terminationDate=${terminationDate}`, {
        method: "PUT",
        headers: getAuthHeaders()
      });

      if (res.ok) {
        addToast(t('contractdetailmanager.terminate_contract_success'), "success");
        setShowTerminateModal(false);
        fetchContractDetails();
      } else {
        const error = await res.json();
        addToast(error.message || t('contractdetailmanager.error_when_terminating_the'), "error");
      }
    } catch {
      addToast(t('contractdetailmanager.server_connection_error'), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const validateRenew = () => {
    const errs = {};
    if (!renewData.startDate) {
      errs.startDate = t('contractdetailmanager.please_select_a_start');
    } else if (contract?.endDate) {
      const currentEndDate = new Date(contract.endDate);
      currentEndDate.setHours(0, 0, 0, 0);
      const inputDate = new Date(renewData.startDate);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate <= currentEndDate) {
        errs.startDate = t('contractdetailmanager.renewal_start_date_must_be_after_current_end');
      }
    }
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
        addToast(t('contractdetailmanager.renew_contract_success'), "success");
        setShowRenewModal(false);
        // Navigate to the newly created renewed contract
        navigate("contract-detail", data.contractId);
      } else {
        addToast(data.message || t('contractdetailmanager.contract_renewal_error'), "error");
      }
    } catch {
      addToast(t('contractdetailmanager.server_connection_error'), "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const selectedFiles = Array.from(e.target.files);
    
    // Check file sizes
    for (const file of selectedFiles) {
      if (file.size > 5 * 1024 * 1024) {
        addToast(t('contractdetailmanager.file_exceeds_size', { name: file.name }), "error");
        return;
      }
    }

    setUploadingFile(true);
    const formData = new FormData();
    
    // Append all selected files to the Form Data under the key "files"
    selectedFiles.forEach(file => {
      formData.append("files", file);
    });

    try {
      const saveRes = await fetch(`${API_BASE}/${contractId}/files`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData
      });

      if (saveRes.ok) {
        addToast(t('contractdetailmanager.upload_scan_success'), "success");
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

  const handleEditVendorSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${contractId}/vendor-info`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          businessName: editVendorData.businessName.trim() || null,
          taxCode: editVendorData.taxCode.trim() || null,
          bankAccount: editVendorData.bankAccount.trim() || null,
          bankName: editVendorData.bankName.trim() || null,
          address: editVendorData.address.trim() || null,
        })
      });

      if (res.ok) {
        addToast(t('contractdetailmanager.update_party_b_success'), "success");
        setShowEditVendorModal(false);
        fetchContractDetails();
      } else {
        const error = await res.json();
        addToast(error.message || t('contractdetailmanager.unable_to_update_party_b'), "error");
      }
    } catch {
      addToast(t('contractdetailmanager.server_connection_error'), "error");
    } finally {
      setActionLoading(false);
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
      case "TerminatedEarly":
        return <span className="status-badge status-terminated-early">{t('contractdetailmanager.terminated_early')}</span>;
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
          {(contract.status === "Active" || contract.status === "Expired") && (
            <>
              <button 
                className="btn-action-terminate" 
                onClick={() => {
                  setTerminationDate(new Date().toISOString().split("T")[0]);
                  setShowTerminateModal(true);
                }}
                disabled={actionLoading}
              >
                {contract.status === "Active" ? t('contractdetailmanager.chm_dt_trc_hn') : t('contractdetailmanager.thanh_ly_hop_dong')}</button>
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
              <h3>{t('contractdetailmanager.contract_title', { id: contract.contractId })}</h3>
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
                <span className="detail-label">{t('contractdetailmanager.deposit_refunded') || "Đã hoàn cọc / Khấu trừ"}</span>
                <span className="detail-value" style={{ color: contract.depositRefunded > 0 ? "#10b981" : "inherit", fontWeight: contract.depositRefunded > 0 ? "bold" : "normal" }}>
                  {formatCurrency(contract.depositRefunded)}
                </span>
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
            <div className="card-header flex-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3>{t('contractdetailmanager.tenant_information_party_b')}</h3>
              <button 
                className="btn-edit-vendor" 
                onClick={() => {
                  setEditVendorData({
                    businessName: contract.vendorBusinessName || "",
                    taxCode: contract.vendorTaxCode || "",
                    bankAccount: contract.vendorBankAccount || "",
                    bankName: contract.vendorBankName || "",
                    address: contract.vendorAddress || "",
                  });
                  setShowEditVendorModal(true);
                }}
                style={{
                  padding: "0.25rem 0.75rem",
                  fontSize: "0.8rem",
                  background: "rgba(37, 99, 235, 0.1)",
                  color: "#2563eb",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s"
                }}
              >
                ✏️ {t('contractdetailmanager.update_info') || "Cập nhật"}
              </button>
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
                multiple
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

      {/* TERMINATE MODAL */}
      {showTerminateModal && (
        <div className="modal-overlay-custom no-print">
          <div className="modal-container-custom">
            <div className="modal-header-custom">
              <h3>{t('contractdetailmanager.terminate_contract_title')}</h3>
              <button className="btn-close-modal" onClick={() => setShowTerminateModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleTerminateSubmit} className="modal-form-custom">
              <div className="modal-form-grid" style={{ gridTemplateColumns: "1fr", padding: "10px 0" }}>
                
                {contract.endDate && terminationDate && (
                  new Date(terminationDate) < new Date(contract.endDate) ? (
                    <div className="terminate-alert-custom warning" style={{ margin: 0 }}>
                      {t('contractdetailmanager.early_termination_warning')}
                    </div>
                  ) : (
                    <div className="terminate-alert-custom info" style={{ margin: 0 }}>
                      {t('contractdetailmanager.normal_termination_info')}
                    </div>
                  )
                )}

              </div>

              <div className="modal-actions-custom">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowTerminateModal(false)}
                  disabled={actionLoading}
                >
                  {t('contractdetailmanager.cancel')}</button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={actionLoading}
                  style={{ backgroundColor: "#dc2626" }}
                >
                  {actionLoading ? t('contractdetailmanager.processing') : t('contractdetailmanager.confirm_termination')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT VENDOR MODAL */}
      {showEditVendorModal && (
        <div className="modal-overlay-custom no-print">
          <div className="modal-container-custom">
            <div className="modal-header-custom">
              <h3>Cập nhật thông tin Bên B</h3>
              <button className="btn-close-modal" onClick={() => setShowEditVendorModal(false)}>✕</button>
            </div>
            
            <form onSubmit={handleEditVendorSubmit} className="modal-form-custom">
              <div className="modal-form-grid">
                
                <div className="form-group-custom" style={{ gridColumn: "span 2" }}>
                  <label>{t('contractdetailmanager.name_of_business_establishment')}</label>
                  <input
                    type="text"
                    value={editVendorData.businessName}
                    onChange={(e) => setEditVendorData({ ...editVendorData, businessName: e.target.value })}
                    placeholder="Nhập tên cơ sở kinh doanh..."
                  />
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.tax_code')}</label>
                  <input
                    type="text"
                    value={editVendorData.taxCode}
                    onChange={(e) => setEditVendorData({ ...editVendorData, taxCode: e.target.value })}
                    placeholder="Nhập mã số thuế..."
                  />
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.business_registration_address')}</label>
                  <input
                    type="text"
                    value={editVendorData.address}
                    onChange={(e) => setEditVendorData({ ...editVendorData, address: e.target.value })}
                    placeholder="Nhập địa chỉ..."
                  />
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.bank_account_number')}</label>
                  <input
                    type="text"
                    value={editVendorData.bankAccount}
                    onChange={(e) => setEditVendorData({ ...editVendorData, bankAccount: e.target.value })}
                    placeholder="Nhập số tài khoản..."
                  />
                </div>

                <div className="form-group-custom">
                  <label>{t('contractdetailmanager.at_the_bank')}</label>
                  <input
                    type="text"
                    value={editVendorData.bankName}
                    onChange={(e) => setEditVendorData({ ...editVendorData, bankName: e.target.value })}
                    placeholder="Nhập tên ngân hàng..."
                  />
                </div>

              </div>

              <div className="modal-actions-custom">
                <button 
                  type="button" 
                  className="btn-cancel" 
                  onClick={() => setShowEditVendorModal(false)}
                  disabled={actionLoading}
                >
                  {t('contractdetailmanager.cancel')}</button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={actionLoading}
                >
                  {actionLoading ? t('contractdetailmanager.processing') : "Lưu thay đổi"}
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
