import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import "./ContractFormManager.css";

const API_STALLS = "http://localhost:5056/api/manager/contracts/available-stalls";
const API_VENDORS = "http://localhost:5056/api/manager/contracts/vendors";
const API_CONTRACTS = "http://localhost:5056/api/manager/contracts";

const getAuthHeaders = () => ({
  "Authorization": `Bearer ${localStorage.getItem('accessToken') || localStorage.getItem('token')}`
});

export default function ContractFormManager({ navigate, addToast }) {
  const { t } = useTranslation();

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
      const headers = getAuthHeaders();
      const [stallsRes, vendorsRes] = await Promise.all([
        fetch(API_STALLS, { headers }),
        fetch(API_VENDORS, { headers })
      ]);

      if (stallsRes.ok && vendorsRes.ok) {
        setStalls(await stallsRes.json());
        setVendors(await vendorsRes.json());
      } else {
        throw new Error();
      }
    } catch {
      addToast(t('contractformmanager.unable_to_download_information'), "error");
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
    if (!formData.stallId) newErrors.stallId = t('contractformmanager.please_select_a_stall');
    if (!formData.userId) newErrors.userId = t('contractformmanager.please_choose_a_merchant');
    if (!formData.startDate) {
      newErrors.startDate = t('contractformmanager.please_select_a_start');
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const inputDate = new Date(formData.startDate);
      inputDate.setHours(0, 0, 0, 0);
      if (inputDate < today) {
        newErrors.startDate = t('contractformmanager.start_date_cannot_be_before_today');
      }
    }
    if (!formData.endDate) newErrors.endDate = t('contractformmanager.please_select_an_end');
    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        newErrors.endDate = t('contractformmanager.the_end_date_must');
      }
    }
    if (!formData.rentFee || parseFloat(formData.rentFee) < 0) {
      newErrors.rentFee = t('contractformmanager.invalid_rental_price');
    }
    if (!formData.deposit || parseFloat(formData.deposit) < 0) {
      newErrors.deposit = t('contractformmanager.invalid_deposit');
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
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        addToast(t('contractformmanager.sign_contract_success'), "success");
        // Navigate to the details page of the newly created contract
        navigate("contract-detail", data.contractId);
      } else {
        addToast(data.message || t('contractformmanager.cannot_sign_contract'), "error");
      }
    } catch {
      addToast(t('contractdetailmanager.server_connection_error'), "error");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="contract-form-container animate-fade-in">
      <div className="form-card">
        <div className="form-card-header">
          <h2>{t('contractformmanager.sign_kiosk_rental_contract')}</h2>
          <p>{t('contractformmanager.enter_business_space_rental')}</p>
        </div>

        {loadingDropdowns ? (
          <div className="form-loading">
            <div className="loading-spinner"></div>
            <span>{t('contractformmanager.loading_form_information')}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-form">
            <div className="form-grid">
              
              {/* Stall selection */}
              <div className="form-group full-width">
                <label>{t('contractformmanager.available_stalls')}</label>
                <select
                  value={formData.stallId}
                  onChange={(e) => handleStallChange(e.target.value)}
                  className={errors.stallId ? "input-error" : ""}
                >
                  <option value="">{t('contractformmanager.select_an_empty_stall')}</option>
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
                <label>{t('contractformmanager.vendor_accounts')}</label>
                <select
                  value={formData.userId}
                  onChange={(e) => handleVendorChange(e.target.value)}
                  className={errors.userId ? "input-error" : ""}
                >
                  <option value="">{t('contractformmanager.select_merchant_account')}</option>
                  {vendors.map((v) => (
                    <option key={v.userId} value={v.userId}>
                      {v.name} ({v.phone}) - {v.businessName || t('contractformmanager.havent_created_a_business')} - CCCD: {v.cccd}
                    </option>
                  ))}
                </select>
                {errors.userId && <span className="error-txt">{errors.userId}</span>}
              </div>

              {/* Optional Vendor Business Info */}
              <div className="form-group">
                <label>{t('contractformmanager.business_name_optional')}</label>
                <input
                  type="text"
                  placeholder={t('contractformmanager.for_example_family_convenience')}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('contractformmanager.party_bs_tax_code')}</label>
                <input
                  type="text"
                  placeholder={t('contractformmanager.enter_tax_code')}
                  value={formData.taxCode}
                  onChange={(e) => setFormData({ ...formData, taxCode: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('contractformmanager.party_bs_bank_account')}</label>
                <input
                  type="text"
                  placeholder={t('contractformmanager.enter_the_bank_account')}
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>{t('contractformmanager.party_bs_bank_name')}</label>
                <input
                  type="text"
                  placeholder={t('contractformmanager.enter_the_bank_and')}
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
              </div>

              {/* Start Date */}
              <div className="form-group">
                <label>{t('contractformmanager.contract_start_date')}</label>
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
                <label>{t('contractformmanager.contract_end_date')}</label>
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
                <label>{t('contractformmanager.rental_price_per_month')}</label>
                <input
                  type="number"
                  placeholder={t('contractformmanager.for_example_3000000')}
                  value={formData.rentFee}
                  onChange={(e) => setFormData({ ...formData, rentFee: e.target.value })}
                  className={errors.rentFee ? "input-error" : ""}
                />
                {errors.rentFee && <span className="error-txt">{errors.rentFee}</span>}
              </div>

              {/* Deposit */}
              <div className="form-group">
                <label>{t('contractformmanager.security_deposit_vnd')}</label>
                <input
                  type="number"
                  placeholder={t('contractformmanager.for_example_9000000')}
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
                {t('contractformmanager.cancel')}</button>
              <button
                type="submit"
                className="btn-submit"
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <span className="spinner-small"></span> {t('contractformmanager.processing')}</>
                ) : (
                  t('contractformmanager.sign_the_contract')
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
