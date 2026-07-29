import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Zap, 
  Droplet, 
  Settings, 
  FileText, 
  CreditCard, 
  AlertTriangle, 
  RefreshCw, 
  Info,
  CheckCircle,
  X,
  Receipt
} from 'lucide-react';

export default function FinancialConfig() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('system'); // 'system' | 'fees' | 'services'
  
  // Data States
  const [feeTypes, setFeeTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [systemConfigs, setSystemConfigs] = useState([]);
  const [electricTiers, setElectricTiers] = useState([]);
  const [waterTiers, setWaterTiers] = useState([]);
  
  const [feeTypesPage, setFeeTypesPage] = useState(1);
  const [servicesPage, setServicesPage] = useState(1);
  const itemsPerPage = 5;
  
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);

  // Inline feedback messages (replacing alert())
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: '' }
  const [modalError, setModalError] = useState(null);

  // Modal control
  const [activeModal, setActiveModal] = useState(null); // 'fee', 'service', 'tier_add', 'tier_edit', 'sys_edit', 'confirm_delete_fee', 'confirm_delete_srv'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTierKey, setSelectedTierKey] = useState('electricity_tiers'); // 'electricity_tiers' | 'water_tiers'

  // Form states
  // react-hook-form setup for Fee Form
  const feeSchema = yup.object().shape({
    name: yup.string().trim().required('Tên phí không được để trống.'),
    unit: yup.string().trim().required('Đơn vị tính không được để trống.'),
    description: yup.string().trim().nullable()
  });
  
  const { 
    register: registerFee, 
    handleSubmit: handleSubmitFee, 
    reset: resetFeeForm,
    formState: { errors: feeErrors } 
  } = useForm({
    resolver: yupResolver(feeSchema)
  });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, billingCycle: 'Monthly', feeTypeId: 1 });
  const [sysForm, setSysForm] = useState({ configKey: '', configValue: '', description: '' });
  
  const [configForm, setConfigForm] = useState({
    auto_invoice_day: '5',
    invoice_due_days: '15',
    late_penalty_rate_per_day: '0.05',
    reminder_days_before_due: '3',
    vat_tax_rate: '0'
  });
  
  // Tier forms
  const [newTierPrice, setNewTierPrice] = useState(1000);
  const [newTierLimit, setNewTierLimit] = useState('');

  // Helper to show toast
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => {
    setActiveModal(null);
    setModalError(null);
    setSelectedItem(null);
    resetFeeForm({ name: '', unit: '', description: '' });
  };

  // Fetch all config data
  const loadAllConfigData = () => {
    setLoading(true);
    setIsMock(false);

    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch('http://localhost:5056/api/accountant/config/fee-types', { headers }).then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/services', { headers }).then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/system-configs', { headers }).then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/tiers/electricity_tiers', { headers }).then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/tiers/water_tiers', { headers }).then(r => r.json())
    ])
    .then(([fees, srvs, sys, elec, water]) => {
      setFeeTypes(fees);
      setServices(srvs);
      setSystemConfigs(sys);
      setElectricTiers(elec);
      setWaterTiers(water);
      setLoading(false);
    })
    .catch(err => {
      console.warn(t('financialconfig.backend_api_connection_error'), err);
      // Fallback Mock data
      setTimeout(() => {
        setFeeTypes(getMockFees());
        setServices(getMockServices());
        setSystemConfigs(getMockSys());
        setElectricTiers(getMockElectricTiers());
        setWaterTiers(getMockWaterTiers());
        setIsMock(true);
        setLoading(false);
      }, 600);
    });
  };

  useEffect(() => {
    loadAllConfigData();
  }, []);

  useEffect(() => {
    if (systemConfigs.length > 0) {
      const form = { ...configForm };
      systemConfigs.forEach(c => {
        if (form[c.configKey] !== undefined) {
          form[c.configKey] = c.configValue;
        }
      });
      setConfigForm(form);
    }
  }, [systemConfigs]);

  // Mock initializers
  const getMockFees = () => [
    { feeTypeId: 1, name: t('financialconfig.premises_rent'), unit: t('financialconfig.month'), description: t('financialconfig.periodic_stall_rental_costs') },
    { feeTypeId: 2, name: t('financialconfig.electricity_bill'), unit: 'kWh', description: t('financialconfig.electricity_consumption') },
    { feeTypeId: 3, name: t('financialconfig.water_fee'), unit: 'm³', description: t('financialconfig.living_water') },
    { feeTypeId: 4, name: t('financialconfig.penalties_for_violations'), unit: t('financialconfig.time'), description: t('financialconfig.revenue_due_to_breach') },
  ];

  const getMockServices = () => [
    { serviceId: 1, name: t('financialconfig.garbage_collection_service'), price: 150000, billingCycle: 'Monthly', feeTypeId: 1, feeTypeName: t('financialconfig.service_fee'), description: t('financialconfig.garbage_collection_at_kiosk') },
    { serviceId: 2, name: t('financialconfig.provide_wifi_connection'), price: 200000, billingCycle: 'Monthly', feeTypeId: 1, feeTypeName: t('financialconfig.service_fee'), description: t('financialconfig.50mbps_high_speed_fiber') },
  ];

  const getMockSys = () => [
    { configId: 1, configKey: 'invoice_due_days', configValue: '15', description: t('financialconfig.the_number_of_days') },
    { configId: 2, configKey: 'vat_rate', configValue: '10', description: t('financialconfig.value_added_tax') },
    { configId: 3, configKey: 'auto_invoice_day', configValue: '5', description: t('financialconfig.day_of_the_month') },
  ];

  const getMockElectricTiers = () => [
    { step: 1, from: 0, to: 50, price: 1800 },
    { step: 2, from: 51, to: 100, price: 2500 },
    { step: 3, from: 101, to: null, price: 3500 },
  ];

  const getMockWaterTiers = () => [
    { step: 1, from: 0, to: 10, price: 10000 },
    { step: 2, from: 11, to: 20, price: 15000 },
    { step: 3, from: 21, to: null, price: 22000    }
  ];

  const handleSaveAllConfigs = async (e) => {
    e.preventDefault();
    if (configForm.auto_invoice_day < 1 || configForm.auto_invoice_day > 28) {
      return showToast('error', t('financialconfig.closing_date_must_be'));
    }
    if (configForm.invoice_due_days < 1) {
      return showToast('error', t('financialconfig.payment_term_must_be'));
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      if (!isMock) {
        const keys = Object.keys(configForm);
        for (const key of keys) {
          const res = await fetch('http://localhost:5056/api/accountant/config/system-configs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ configKey: key, configValue: configForm[key].toString(), updatedByUserId: 1 })
          });
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('financialconfig.error_updating_key'));
          }
        }
      }
      showToast('success', t('financialconfig.saved_system_configuration_successfully'));
      loadAllConfigData();
    } catch(err) {
      showToast('error', err.message || t('financialconfig.error_saving_configuration'));
      setLoading(false);
    }
  };

  // --- TABS & RENDERING ---

  // 1. Fee Types
  const handleFeeSubmit = handleSubmitFee((data) => {
    const payload = { 
      name: data.name, 
      unit: data.unit, 
      description: data.description || '' 
    };

    if (isMock) {
      if (selectedItem) {
        setFeeTypes(feeTypes.map(f => f.feeTypeId === selectedItem.feeTypeId ? { ...f, ...payload } : f));
        showToast('success', t('financialconfig.updated_fee_type_mock'));
      } else {
        setFeeTypes([...feeTypes, { feeTypeId: Math.floor(Math.random() * 100) + 10, ...payload }]);
        showToast('success', t('financialconfig.added_fee_type_mock'));
      }
      closeModal();
    } else {
      const url = selectedItem 
        ? `http://localhost:5056/api/accountant/config/fee-types/${selectedItem.feeTypeId}` 
        : 'http://localhost:5056/api/accountant/config/fee-types';
      const method = selectedItem ? 'PUT' : 'POST';
      const token = localStorage.getItem('accessToken');
      
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.title || t('financialconfig.operation_failed'));
        }
        showToast('success', t('financialconfig.fee_type_updated_successfully'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  });

  const deleteFeeType = () => {
    if (isMock) {
      setFeeTypes(feeTypes.filter(f => f.feeTypeId !== selectedItem.feeTypeId));
      showToast('success', t('financialconfig.removed_fee_type_mock'));
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/accountant/config/fee-types/${selectedItem.feeTypeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('financialconfig.this_type_of_charge'));
          }
        showToast('success', t('financialconfig.successfully_removed_fees'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  };

  // 2. Services
  const handleServiceSubmit = (e) => {
    e.preventDefault();
    const nameTrimmed = serviceForm.name ? serviceForm.name.trim() : '';
    const descTrimmed = serviceForm.description ? serviceForm.description.trim() : '';
    const priceVal = parseFloat(serviceForm.price);
    const feeIdVal = parseInt(serviceForm.feeTypeId);

    const isEdit = !!selectedItem;

    const isServiceActive = serviceForm.isActive !== undefined ? serviceForm.isActive : true;

    const payload = isEdit 
      ? { name: nameTrimmed, description: descTrimmed, price: priceVal, billingCycle: serviceForm.billingCycle, feeTypeId: feeIdVal, isActive: isServiceActive }
      : { name: nameTrimmed, description: descTrimmed, price: priceVal, billingCycle: serviceForm.billingCycle, feeTypeId: feeIdVal, createdByUserId: 1 };

    const url = isEdit ? `http://localhost:5056/api/accountant/config/services/${selectedItem.serviceId}` : 'http://localhost:5056/api/accountant/config/services';
    const method = isEdit ? 'PUT' : 'POST';

    if (isMock) {
      const mappedTypeName = feeTypes.find(f => f.feeTypeId === feeIdVal)?.name || t('financialconfig.service_fee');
      if (isEdit) {
        setServices(services.map(s => s.serviceId === selectedItem.serviceId ? { ...s, ...payload, feeTypeName: mappedTypeName } : s));
      } else {
        setServices([...services, { serviceId: Math.floor(Math.random() * 100) + 10, ...payload, feeTypeName: mappedTypeName, isActive: true }]);
      }
      showToast('success', t('financialconfig.updated_service_mock'));
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || errData.title || t('financialconfig.operation_failed'));
        }
        showToast('success', t('financialconfig.service_update_successful'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  };

  const deleteService = () => {
    if (isMock) {
      setServices(services.filter(s => s.serviceId !== selectedItem.serviceId));
      showToast('success', t('financialconfig.service_mock_removed'));
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/accountant/config/services/${selectedItem.serviceId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('financialconfig.this_service_cannot_be'));
          }
        showToast('success', t('financialconfig.service_deletion_successful'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  };

  // 3. System Config
  const handleSysSubmit = (e) => {
    e.preventDefault();
    const val = sysForm.configValue ? sysForm.configValue.trim() : '';
    if (!val) {
      setModalError(t('financialconfig.configuration_values_cannot_be'));
      return;
    }

    if (isMock) {
      setSystemConfigs(systemConfigs.map(c => c.configKey === sysForm.configKey ? { ...c, configValue: sysForm.configValue } : c));
      showToast('success', t('financialconfig.configuration_saved_mock'));
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch('http://localhost:5056/api/accountant/config/system-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          configKey: sysForm.configKey,
          configValue: val,
          updatedByUserId: 1
        })
      })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('financialconfig.the_configuration_update_operation'));
          }
        showToast('success', t('financialconfig.configuration_update_successful'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  };

  // 4. Adding Utility Tier Step (Incremental validation)
  const handleAddTierStep = (e) => {
    e.preventDefault();
    const isElectric = selectedTierKey === 'electricity_tiers';
    const currentTiers = isElectric ? electricTiers : waterTiers;
    
    if (newTierPrice < 0) {
      setModalError(t('financialconfig.the_new_step_unit'));
      return;
    }

    if (currentTiers.length === 0) {
      // Bậc đầu tiên mặc định bắt đầu từ 0 đến Vô hạn
      const newStep = {
        step: 1,
        from: 0,
        to: null,
        price: parseFloat(newTierPrice)
      };
      saveTiersToBackend(selectedTierKey, [newStep]);
    } else {
      const maxStep = Math.max(...currentTiers.map(tierItem => tierItem.step));
      const lastStep = currentTiers.find(tierItem => tierItem.step === maxStep);
      
      if (!newTierLimit || newTierLimit.trim() === '') {
        setModalError(t('financialconfig.please_enter_a_new'));
        return;
      }

      const limitVal = parseInt(newTierLimit);
      if (isNaN(limitVal) || limitVal <= lastStep.from) {
        setModalError(t('financialconfig.the_new_ending_limit'));
        return;
      }

      // Cập nhật bậc cuối hiện tại và tạo bậc tiếp theo
      const updatedTiers = currentTiers.map(tierItem => {
        if (tierItem.step === maxStep) {
          return { ...tierItem, to: limitVal };
        }
        return tierItem;
      });

      const newStep = {
        step: maxStep + 1,
        from: limitVal + 1,
        to: null,
        price: parseFloat(newTierPrice)
      };

      updatedTiers.push(newStep);
      saveTiersToBackend(selectedTierKey, updatedTiers);
    }
  };

  const saveTiersToBackend = (key, stepsList) => {
    if (isMock) {
      if (key === 'electricity_tiers') setElectricTiers(stepsList);
      else setWaterTiers(stepsList);
      showToast('success', t('financialconfig.updated_ladder_pricing_mock'));
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch('http://localhost:5056/api/accountant/config/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          configKey: key,
          steps: stepsList,
          updatedByUserId: 1
        })
      })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('financialconfig.unable_to_save_stairs'));
          }
        showToast('success', t('financialconfig.configure_ladder_tariff_successfully'));
        closeModal();
        loadAllConfigData();
      })
      .catch(err => {
        if (activeModal) {
          setModalError(err.message);
        } else {
          showToast('error', err.message);
        }
      });
    }
  };

  const deleteTierStep = (key, stepNum) => {
    const currentTiers = key === 'electricity_tiers' ? electricTiers : waterTiers;
    // We only allow deleting the LAST step to maintain contiguous indices
    const maxStep = Math.max(...currentTiers.map(tierItem => tierItem.step));
    if (stepNum !== maxStep) {
      showToast('error', t('financialconfig.you_are_only_allowed'));
      return;
    }

    if (window.confirm(t('financialconfig.are_you_sure_you'))) {
      let updatedTiers = currentTiers.filter(tierItem => tierItem.step !== stepNum);
      // Ensure the new last step's "to" value is open-ended (null)
      if (updatedTiers.length > 0) {
        updatedTiers = updatedTiers.map(tierItem => tierItem.step === maxStep - 1 ? { ...tierItem, to: null } : tierItem);
      }
      saveTiersToBackend(key, updatedTiers);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'system', label: t('financialconfig.general_configuration_ladder'), icon: Settings },
    { id: 'fees', label: t('financialconfig.fee_list'), icon: CreditCard },
    { id: 'services', label: t('financialconfig.registration_services'), icon: FileText },
  ];

  return (
    <div className="acc-page-container">

      {/* Page Header */}
      <div className="page-header" style={{ display: "none" }}>
        <div>
          <h1 className="page-title">{t('financialconfig.financial_configuration')}</h1>
          <p className="page-subtitle">
            {t('financialconfig.set_up_a_system')}</p>
        </div>
        <div className="page-actions"></div>
      </div>

      {/* Mock Mode Alert */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={17} className="alert-icon" />
          <span>
            <strong>{t('financialconfig.simulation_mode')}</strong> {t('financialconfig.unable_to_connect_to')}</span>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`alert ${toast.type === 'success' ? 'alert-success' : 'alert-danger'}`}
          style={{ cursor: 'pointer' }}
          onClick={() => setToast(null)}
        >
          {toast.type === 'success'
            ? <CheckCircle size={17} className="alert-icon" />
            : <AlertTriangle size={17} className="alert-icon" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="acc-tabs-header">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`acc-tab-btn${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={15} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <span className="loading-text">{t('financialconfig.loading_financial_configuration_data')}</span>
        </div>
      ) : (
        <div style={{ width: '100%' }}>

          {/* ─── TAB 1: SYSTEM CONFIG & UTILITY TIERS ─── */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* System Config Cards */}
              <div className="acc-card" style={{ padding: "20px" }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Settings size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                      {t('financialconfig.system_configuration_parameters')}</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      {t('financialconfig.global_variables_control_the')}</p>
                  </div>
                </div>

                <form onSubmit={handleSaveAllConfigs}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Nhóm Chu kỳ & Thanh toán */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><Receipt size={16}/> {t('financialconfig.cycles_billing')}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="acc-form-label" style={{ fontSize: 13, marginBottom: 4 }}>{t('financialconfig.closing_date_for_invoice')}</label>
                          <input type="number" min="1" max="28" required className="acc-input" style={{ width: '100%' }} value={configForm.auto_invoice_day} onChange={e => setConfigForm({...configForm, auto_invoice_day: e.target.value})} />
                        </div>
                        <div>
                          <label className="acc-form-label" style={{ fontSize: 13, marginBottom: 4 }}>{t('financialconfig.invoice_payment_term_number')}</label>
                          <input type="number" min="1" required className="acc-input" style={{ width: '100%' }} value={configForm.invoice_due_days} onChange={e => setConfigForm({...configForm, invoice_due_days: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm Thông báo & Chế tài */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16}/> {t('financialconfig.notice_sanctions')}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="acc-form-label" style={{ fontSize: 13, marginBottom: 4 }}>{t('financialconfig.reminder_before_deadline_number')}</label>
                          <input type="number" min="0" required className="acc-input" style={{ width: '100%' }} value={configForm.reminder_days_before_due} onChange={e => setConfigForm({...configForm, reminder_days_before_due: e.target.value})} />
                        </div>
                        <div>
                          <label className="acc-form-label" style={{ fontSize: 13, marginBottom: 4 }}>{t('financialconfig.late_penalty_interest_rate')}</label>
                          <input type="number" step="0.01" min="0" required className="acc-input" style={{ width: '100%' }} value={configForm.late_penalty_rate_per_day} onChange={e => setConfigForm({...configForm, late_penalty_rate_per_day: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm Thuế & Phí chung */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={16}/> {t('financialconfig.general_taxes_fees')}</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="acc-form-label" style={{ fontSize: 13, marginBottom: 4 }}>{t('financialconfig.value_added_tax_vat')}</label>
                          <input type="number" min="0" max="100" required className="acc-input" style={{ width: '100%' }} value={configForm.vat_tax_rate} onChange={e => setConfigForm({...configForm, vat_tax_rate: e.target.value})} />
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button type="submit" className="acc-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={16} /> {t('financialconfig.save_system_configuration')}</button>
                  </div>
                </form>
              </div>

              {/* Utility Tiers — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>

                {/* Electricity Tiers */}
                <div className="acc-card" style={{ padding: "20px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--warning-light)', color: 'var(--warning)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Zap size={17} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-title)' }}>
                          {t('financialconfig.stepped_electricity_price_schedule')}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {t('financialconfig.unit_vndkwh')}</p>
                      </div>
                    </div>
                    <button
                      className="acc-btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTierKey('electricity_tiers');
                        setNewTierPrice(2000);
                        setNewTierLimit('');
                        setActiveModal('tier_add');
                      }}
                    >
                      <Plus size={13} />
                      {t('financialconfig.add_steps')}</button>
                  </div>

                  <table className="acc-table">
                    <thead>
                      <tr>
                        <th>{t('financialconfig.tier')}</th>
                        <th>{t('financialconfig.from_kwh')}</th>
                        <th>{t('financialconfig.to_kwh')}</th>
                        <th className="text-right">{t('financialconfig.unit_price')}</th>
                        <th className="text-right">{t('financialconfig.erase')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {electricTiers.map(tierItem => (
                        <tr key={tierItem.step}>
                          <td>
                            <span className="acc-badge warning">Bậc {tierItem.step}</span>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{tierItem.from}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {tierItem.to === null ? <span className="acc-badge neutral">{t('financialconfig.infinite')}</span> : tierItem.to}
                          </td>
                          <td className="text-right" style={{ fontWeight: '700', color: 'var(--warning)' }}>
                            {tierItem.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="text-right">
                            {tierItem.step === electricTiers.length && tierItem.step > 1 && (
                              <button
                                className="acc-btn-ghost btn-sm"
                                onClick={() => deleteTierStep('electricity_tiers', tierItem.step)}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Water Tiers */}
                <div className="acc-card" style={{ padding: "20px" }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--info-light)', color: 'var(--info)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Droplet size={17} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-title)' }}>
                          {t('financialconfig.stepped_water_tariff')}</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          {t('financialconfig.unit_vndm')}</p>
                      </div>
                    </div>
                    <button
                      className="acc-btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTierKey('water_tiers');
                        setNewTierPrice(12000);
                        setNewTierLimit('');
                        setActiveModal('tier_add');
                      }}
                    >
                      <Plus size={13} />
                      {t('financialconfig.add_steps')}</button>
                  </div>

                  <table className="acc-table">
                    <thead>
                      <tr>
                        <th>{t('financialconfig.tier')}</th>
                        <th>{t('financialconfig.word_m')}</th>
                        <th>{t('financialconfig.to_m')}</th>
                        <th className="text-right">{t('financialconfig.unit_price')}</th>
                        <th className="text-right">{t('financialconfig.erase')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waterTiers.map(tierItem => (
                        <tr key={tierItem.step}>
                          <td>
                            <span className="acc-badge info">Bậc {tierItem.step}</span>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{tierItem.from}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {tierItem.to === null ? <span className="acc-badge neutral">{t('financialconfig.infinite')}</span> : tierItem.to}
                          </td>
                          <td className="text-right" style={{ fontWeight: '700', color: 'var(--info)' }}>
                            {tierItem.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="text-right">
                            {tierItem.step === waterTiers.length && tierItem.step > 1 && (
                              <button
                                className="acc-btn-ghost btn-sm"
                                onClick={() => deleteTierStep('water_tiers', tierItem.step)}
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>
            </div>
          )}

          {/* ─── TAB 2: FEE TYPES ─── */}
          {activeTab === 'fees' && (
            <div className="acc-card" style={{ padding: "20px" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                    {t('financialconfig.manage_fee_category')}</h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {feeTypes.length} loại phí đã được cấu hình trong hệ thống.
                  </p>
                </div>
                <button
                  className="acc-btn-primary btn-sm"
                  onClick={() => {
                    setSelectedItem(null);
                    resetFeeForm({ name: '', unit: '', description: '' });
                    setActiveModal('fee');
                  }}
                >
                  <Plus size={14} />
                  {t('financialconfig.add_fees')}</button>
              </div>

              <table className="acc-table">
                <thead>
                  <tr>
                    <th>{t('financialconfig.fee_code')}</th>
                    <th>{t('financialconfig.fee_type_name')}</th>
                    <th>{t('financialconfig.unit_of_calculation')}</th>
                    <th>{t('financialconfig.detailed_description')}</th>
                    <th className="text-right">{t('financialconfig.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTypes.slice((feeTypesPage - 1) * itemsPerPage, feeTypesPage * itemsPerPage).map(f => (
                    <tr key={f.feeTypeId}>
                      <td>
                        <span className="badge badge-primary" style={{ fontFamily: 'monospace' }}>
                          FEE-{f.feeTypeId}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--text-title)' }}>{f.name}</td>
                      <td>
                        {f.unit
                          ? <span className="acc-badge neutral">{f.unit}</span>
                          : <span style={{ color: 'var(--text-placeholder)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{f.description}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="acc-btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedItem(f);
                              resetFeeForm({ name: f.name, unit: f.unit, description: f.description || '' });
                              setActiveModal('fee');
                            }}
                            title={t('financialconfig.edit')}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="acc-btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedItem(f);
                              setActiveModal('confirm_delete_fee');
                            }}
                            title={t('financialconfig.erase')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {feeTypes.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((feeTypesPage - 1) * itemsPerPage) + 1} - {Math.min(feeTypesPage * itemsPerPage, feeTypes.length)} trong tổng số {feeTypes.length} loại phí
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setFeeTypesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={feeTypesPage === 1}
                    >
                      {t('financialconfig.before')}</button>
                    {Array.from({ length: Math.ceil(feeTypes.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${feeTypesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFeeTypesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setFeeTypesPage(prev => Math.min(prev + 1, Math.ceil(feeTypes.length / itemsPerPage)))} 
                      disabled={feeTypesPage === Math.ceil(feeTypes.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── TAB 3: SERVICES ─── */}
          {activeTab === 'services' && (
            <div className="acc-card" style={{ padding: "20px" }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                    {t('financialconfig.list_of_subscription_services')}</h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {services.length} dịch vụ đang hoạt động trong hệ thống.
                  </p>
                </div>
                <button
                  className="acc-btn-primary btn-sm"
                  onClick={() => {
                    setSelectedItem(null);
                    setServiceForm({ name: '', description: '', price: 50000, billingCycle: 'Monthly', feeTypeId: feeTypes[0]?.feeTypeId || 1, isActive: true });
                    setActiveModal('service');
                  }}
                >
                  <Plus size={14} />
                  {t('financialconfig.add_services')}</button>
              </div>

              <table className="acc-table">
                <thead>
                  <tr>
                    <th>{t('financialconfig.service_name')}</th>
                    <th>{t('financialconfig.type_of_invoice_issuance')}</th>
                    <th>{t('financialconfig.cycle')}</th>
                    <th className="text-right">{t('financialconfig.service_unit_price')}</th>
                    <th>{t('financialconfig.describe')}</th>
                    <th>{t('financialconfig.status')}</th>
                    <th className="text-right">{t('financialconfig.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {services.slice((servicesPage - 1) * itemsPerPage, servicesPage * itemsPerPage).map(s => (
                    <tr key={s.serviceId} style={{ opacity: s.isActive === false ? 0.6 : 1 }}>
                      <td style={{ fontWeight: '700', color: 'var(--text-title)' }}>{s.name}</td>
                      <td>
                        <span className="badge badge-primary">{s.feeTypeName}</span>
                      </td>
                      <td>
                        <span className="acc-badge neutral">
                          {s.billingCycle === 'Monthly' ? t('financialconfig.monthly') : s.billingCycle === 'One-time' ? t('financialconfig.once') : t('financialconfig.annual')}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        {s.price.toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.description}</td>
                      <td>
                        {s.isActive !== false ? (
                          <span className="acc-badge success" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>{t('financialconfig.active')}</span>
                        ) : (
                          <span className="acc-badge neutral" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>{t('financialconfig.stop_working')}</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="acc-btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedItem(s);
                              setServiceForm({ name: s.name, description: s.description || '', price: s.price, billingCycle: s.billingCycle, feeTypeId: s.feeTypeId, isActive: s.isActive ?? true });
                              setActiveModal('service');
                            }}
                            title={t('financialconfig.edit')}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="acc-btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedItem(s);
                              setActiveModal('confirm_delete_srv');
                            }}
                            title={t('financialconfig.stop_working')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {services.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((servicesPage - 1) * itemsPerPage) + 1} - {Math.min(servicesPage * itemsPerPage, services.length)} trong tổng số {services.length} dịch vụ
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setServicesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={servicesPage === 1}
                    >
                      {t('financialconfig.before')}</button>
                    {Array.from({ length: Math.ceil(services.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${servicesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setServicesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setServicesPage(prev => Math.min(prev + 1, Math.ceil(services.length / itemsPerPage)))} 
                      disabled={servicesPage === Math.ceil(services.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* MODALS                                       */}
      {/* ═══════════════════════════════════════════ */}

      {/* 1. Modal: Add / Edit Fee Type */}
      {activeModal === 'fee' && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-container">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">
                {selectedItem ? t('financialconfig.edit_fee_type') : t('financialconfig.add_new_fee_type')}
              </h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleFeeSubmit}>
              <div className="acc-modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="mb-3">
                  <label className="acc-form-label">{t('financialconfig.charge_name')}<span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${feeErrors.name ? 'is-invalid' : ''}`}
                    {...registerFee('name')}
                  />
                  {feeErrors.name && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.name.message}</div>}
                </div>
                <div className="mb-3">
                  <label className="acc-form-label">{t('financialconfig.unit_eg_kwh_m3')}<span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${feeErrors.unit ? 'is-invalid' : ''}`}
                    {...registerFee('unit')}
                  />
                  {feeErrors.unit && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.unit.message}</div>}
                </div>
                <div className="mb-3">
                  <label className="acc-form-label">{t('financialconfig.describe')}</label>
                  <textarea 
                    className={`form-textarea ${feeErrors.description ? 'is-invalid' : ''}`}
                    rows="3" 
                    {...registerFee('description')}
                  ></textarea>
                  {feeErrors.description && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.description.message}</div>}
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={closeModal}>
                  {t('financialconfig.cancel')}</button>
                <button type="submit" className="acc-btn-primary">
                  <Save size={14} />
                  {t('financialconfig.save_changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Confirm Delete Fee Type */}
      {activeModal === 'confirm_delete_fee' && selectedItem && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">{t('financialconfig.confirm_fee_deletion')}</h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                <AlertTriangle size={17} className="alert-icon" />
                <span>
                  {t('financialconfig.are_you_sure_you')}<strong>"{selectedItem.name}"</strong>{t('financialconfig.this_action_may_affect')}</span>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={closeModal}>{t('financialconfig.cancel')}</button>
              <button className="acc-btn-danger" onClick={deleteFeeType}>
                <Trash2 size={14} />
                {t('financialconfig.confirm_deletion')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add / Edit Service */}
      {activeModal === 'service' && (
        <div className="acc-modal-overlay">
          <div className="acc-modal-container">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">
                {selectedItem ? t('financialconfig.edit_service') : t('financialconfig.add_new_service')}
              </h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleServiceSubmit}>
              <div className="acc-modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="acc-form-label">{t('financialconfig.service_name')}<span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="acc-input"
                    type="text"
                    required
                    maxLength={150}
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder={t('financialconfig.service_name')}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="acc-form-label">{t('financialconfig.service_unit_price_vnd')}<span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      className="acc-input"
                      type="number"
                      required
                      min={0}
                      value={serviceForm.price}
                      onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="acc-form-label">{t('financialconfig.charge_cycle')}</label>
                    <select
                      className="form-select"
                      value={serviceForm.billingCycle}
                      onChange={e => setServiceForm({ ...serviceForm, billingCycle: e.target.value })}
                    >
                      <option value="Monthly">{t('financialconfig.monthly')}</option>
                      <option value="One-time">{t('financialconfig.onetime')}</option>
                      <option value="Yearly">{t('financialconfig.yearly')}</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="acc-form-label">{t('financialconfig.invoicing_link_fee_type')}</label>
                  <select
                    className="form-select"
                    value={serviceForm.feeTypeId}
                    onChange={e => setServiceForm({ ...serviceForm, feeTypeId: parseInt(e.target.value) })}
                  >
                    {feeTypes.map(f => (
                      <option key={f.feeTypeId} value={f.feeTypeId}>{f.name}</option>
                    ))}
                  </select>
                </div>

                {selectedItem && (
                  <div>
                    <label className="acc-form-label">{t('financialconfig.operating_status')}</label>
                    <select
                      className="form-select"
                      value={serviceForm.isActive ? "true" : "false"}
                      onChange={e => setServiceForm({ ...serviceForm, isActive: e.target.value === "true" })}
                    >
                      <option value="true">{t('financialconfig.active')}</option>
                      <option value="false">{t('financialconfig.stop_working')}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="acc-form-label">{t('financialconfig.service_description')}</label>
                  <textarea
                    className="form-textarea"
                    value={serviceForm.description}
                    maxLength={500}
                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows={3}
                    placeholder={t('financialconfig.detailed_description_of_services')}
                  />
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={closeModal}>{t('financialconfig.cancel')}</button>
                <button type="submit" className="acc-btn-primary">
                  <Save size={14} />
                  {t('financialconfig.save_service')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Confirm Delete Service */}
      {activeModal === 'confirm_delete_srv' && selectedItem && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">{t('financialconfig.confirm_service_discontinuation')}</h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                <AlertTriangle size={17} className="alert-icon" />
                <div>
                  <p>{t('financialconfig.are_you_sure_you')}<strong>"{selectedItem.name}"</strong>?</p>
                  <p style={{ marginTop: '6px', fontSize: '12.5px', opacity: 0.85 }}>
                    {t('financialconfig.the_system_will_hide')}</p>
                </div>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={closeModal}>{t('financialconfig.cancel')}</button>
              <button className="acc-btn-danger" onClick={deleteService}>
                <Trash2 size={14} />
                {t('financialconfig.stop_working')}</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit System Config */}
      {activeModal === 'sys_edit' && selectedItem && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">{t('financialconfig.edit_system_parameters')}</h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleSysSubmit}>
              <div className="acc-modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div style={{
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-base)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {t('financialconfig.configuration_lock')}</span>
                  <p style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: 'var(--primary)',
                    marginTop: '4px',
                    fontFamily: "'SF Mono', 'Fira Code', monospace",
                  }}>
                    {sysForm.configKey}
                  </p>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {sysForm.description}
                  </p>
                </div>

                <div>
                  <label className="acc-form-label">{t('financialconfig.setting_value')}<span style={{ color: 'var(--danger)' }}>*</span></label>
                  {sysForm.configKey === 'auto_invoice_day' ? (
                    <select
                      className="form-select"
                      style={{
                        width: '100%',
                        height: '42px',
                        padding: '0 14px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        fontSize: '14px',
                        outline: 'none',
                        transition: 'border-color 0.2s ease',
                      }}
                      required
                      value={sysForm.configValue}
                      onChange={e => setSysForm({ ...sysForm, configValue: e.target.value })}
                    >
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={String(day)}>Ngày {day} hàng tháng</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="acc-input"
                      type="text"
                      required
                      maxLength={255}
                      value={sysForm.configValue}
                      onChange={e => setSysForm({ ...sysForm, configValue: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={closeModal}>{t('financialconfig.cancel')}</button>
                <button type="submit" className="acc-btn-primary">
                  <Save size={14} />
                  {t('financialconfig.save_configuration')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Tier Step */}
      {activeModal === 'tier_add' && (
        <div className="acc-modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="acc-modal-header">
              <h2 className="acc-modal-title">
                Thêm bậc giá {selectedTierKey === 'electricity_tiers' ? t('financialconfig.electricity') : t('financialconfig.water')} mới
              </h2>
              <button className="acc-modal-close" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            {(() => {
              const currentTiers = selectedTierKey === 'electricity_tiers' ? electricTiers : waterTiers;
              const hasTiers = currentTiers.length > 0;
              const lastStep = hasTiers ? currentTiers[currentTiers.length - 1] : null;

              return (
                <form onSubmit={handleAddTierStep}>
                  <div className="acc-modal-body">
                    {modalError && (
                        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                          <AlertTriangle size={16} className="alert-icon" />
                          <span>{modalError}</span>
                        </div>
                    )}
                    {hasTiers ? (
                      <div className="alert alert-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={16} className="alert-icon" />
                          <span><strong>{t('financialconfig.update_ladder')}</strong></span>
                        </div>
                        <span style={{ fontSize: '12.5px' }}>
                          Bậc {lastStep.step} hiện tại (từ {lastStep.from} đến Vô cùng) sẽ được gán giới hạn kết thúc mới.
                          Bậc {lastStep.step + 1} mới sẽ tự động được tạo và áp dụng từ giới hạn đó + 1 đến **Vô cùng**.
                        </span>
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <Info size={16} className="alert-icon" />
                        <span>{t('financialconfig.the_first_tier_tier')}</span>
                      </div>
                    )}

                    {hasTiers && (
                      <div>
                        <label className="acc-form-label">
                          Giới hạn kết thúc mới cho Bậc {lastStep.step} <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                          className="acc-input"
                          type="number"
                          required
                          min={lastStep.from + 1}
                          placeholder={t('financialconfig.enter_a_number_greater')}
                          value={newTierLimit}
                          onChange={e => setNewTierLimit(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="acc-form-label">
                        Đơn giá áp dụng cho {hasTiers ? `Bậc ${lastStep.step + 1} mới (từ ${newTierLimit ? parseInt(newTierLimit) + 1 : '...'} trở đi)` : t('financialconfig.level_1_from_0')} (đ/{selectedTierKey === 'electricity_tiers' ? 'kWh' : 'm³'}) <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        className="acc-input"
                        type="number"
                        required
                        min="0"
                        placeholder={t('financialconfig.enter_unit_price')}
                        value={newTierPrice}
                        onChange={e => setNewTierPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="acc-modal-footer">
                    <button type="button" className="acc-btn-secondary" onClick={closeModal}>{t('financialconfig.cancel')}</button>
                    <button type="submit" className="acc-btn-primary">
                      <Plus size={14} />
                      {t('financialconfig.confirm_additional_steps')}</button>
                  </div>
                </form>
              );
            })()}
          </div>
        </div>
      )}

    </div>
  );
}
