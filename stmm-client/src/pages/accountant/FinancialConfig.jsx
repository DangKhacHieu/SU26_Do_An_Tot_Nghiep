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
      console.warn('Lỗi kết nối API Backend, chuyển đổi sang dữ liệu giả lập:', err);
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
    { feeTypeId: 1, name: 'Tiền thuê mặt bằng', unit: 'Tháng', description: 'Chi phí thuê sạp định kỳ' },
    { feeTypeId: 2, name: 'Tiền điện', unit: 'kWh', description: 'Điện tiêu thụ' },
    { feeTypeId: 3, name: 'Tiền nước', unit: 'm³', description: 'Nước sinh hoạt' },
    { feeTypeId: 4, name: 'Phạt vi phạm', unit: 'Lần', description: 'Khoản thu do vi phạm hợp đồng' },
  ];

  const getMockServices = () => [
    { serviceId: 1, name: 'Dịch vụ thu gom rác', price: 150000, billingCycle: 'Monthly', feeTypeId: 1, feeTypeName: 'Phí dịch vụ', description: 'Thu gom rác tại Kiosk 2 lần/ngày' },
    { serviceId: 2, name: 'Cung cấp đường truyền Wifi', price: 200000, billingCycle: 'Monthly', feeTypeId: 1, feeTypeName: 'Phí dịch vụ', description: 'Gói cáp quang tốc độ cao 50Mbps' },
  ];

  const getMockSys = () => [
    { configId: 1, configKey: 'invoice_due_days', configValue: '15', description: 'Số ngày hạn thanh toán hóa đơn kể từ lúc phát hành' },
    { configId: 2, configKey: 'vat_rate', configValue: '10', description: 'Thuế giá trị gia tăng (%)' },
    { configId: 3, configKey: 'auto_invoice_day', configValue: '5', description: 'Ngày trong tháng tự động khởi tạo hóa đơn của các sạp (1-28)' },
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
      return showToast('error', 'Ngày chốt sổ phải từ 1 đến 28.');
    }
    if (configForm.invoice_due_days < 1) {
      return showToast('error', 'Hạn thanh toán phải lớn hơn 0.');
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
            throw new Error(errData.detail || errData.title || `Lỗi cập nhật ${key}`);
          }
        }
      }
      showToast('success', 'Lưu cấu hình hệ thống thành công!');
      loadAllConfigData();
    } catch(err) {
      showToast('error', err.message || 'Lỗi khi lưu cấu hình');
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
        showToast('success', 'Đã cập nhật loại phí (Mock)!');
      } else {
        setFeeTypes([...feeTypes, { feeTypeId: Math.floor(Math.random() * 100) + 10, ...payload }]);
        showToast('success', 'Đã thêm loại phí (Mock)!');
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
          throw new Error(errData.detail || errData.title || 'Thao tác thất bại');
        }
        showToast('success', 'Cập nhật loại phí thành công!');
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  });

  const deleteFeeType = () => {
    if (isMock) {
      setFeeTypes(feeTypes.filter(f => f.feeTypeId !== selectedItem.feeTypeId));
      showToast('success', 'Đã xóa loại phí (Mock)!');
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/accountant/config/fee-types/${selectedItem.feeTypeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || 'Không thể xóa loại phí này.');
          }
        showToast('success', 'Xóa loại phí thành công!');
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
      const mappedTypeName = feeTypes.find(f => f.feeTypeId === feeIdVal)?.name || 'Phí dịch vụ';
      if (isEdit) {
        setServices(services.map(s => s.serviceId === selectedItem.serviceId ? { ...s, ...payload, feeTypeName: mappedTypeName } : s));
      } else {
        setServices([...services, { serviceId: Math.floor(Math.random() * 100) + 10, ...payload, feeTypeName: mappedTypeName, isActive: true }]);
      }
      showToast('success', 'Đã cập nhật dịch vụ (Mock)!');
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
          throw new Error(errData.detail || errData.title || 'Thao tác thất bại');
        }
        showToast('success', 'Cập nhật dịch vụ thành công!');
        closeModal();
        loadAllConfigData();
      })
      .catch(err => setModalError(err.message));
    }
  };

  const deleteService = () => {
    if (isMock) {
      setServices(services.filter(s => s.serviceId !== selectedItem.serviceId));
      showToast('success', 'Đã xóa dịch vụ (Mock)!');
      closeModal();
    } else {
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/accountant/config/services/${selectedItem.serviceId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async res => {
          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || 'Không thể xóa dịch vụ này.');
          }
        showToast('success', 'Xóa dịch vụ thành công!');
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
      setModalError('Giá trị cấu hình không được để trống.');
      return;
    }

    if (isMock) {
      setSystemConfigs(systemConfigs.map(c => c.configKey === sysForm.configKey ? { ...c, configValue: sysForm.configValue } : c));
      showToast('success', 'Đã lưu cấu hình (Mock)!');
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
            throw new Error(errData.detail || errData.title || 'Thao tác cập nhật cấu hình thất bại.');
          }
        showToast('success', 'Cập nhật cấu hình thành công!');
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
      setModalError('Đơn giá bậc thang mới phải lớn hơn hoặc bằng 0.');
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
      const maxStep = Math.max(...currentTiers.map(t => t.step));
      const lastStep = currentTiers.find(t => t.step === maxStep);
      
      if (!newTierLimit || newTierLimit.trim() === '') {
        setModalError('Vui lòng nhập giới hạn kết thúc mới cho bậc hiện tại.');
        return;
      }

      const limitVal = parseInt(newTierLimit);
      if (isNaN(limitVal) || limitVal <= lastStep.from) {
        setModalError(`Giới hạn kết thúc mới (${limitVal}) phải là số nguyên và lớn hơn chỉ số bắt đầu của bậc cuối hiện tại (${lastStep.from}).`);
        return;
      }

      // Cập nhật bậc cuối hiện tại và tạo bậc tiếp theo
      const updatedTiers = currentTiers.map(t => {
        if (t.step === maxStep) {
          return { ...t, to: limitVal };
        }
        return t;
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
      showToast('success', 'Đã cập nhật biểu giá bậc thang (Mock)!');
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
            throw new Error(errData.detail || errData.title || 'Không thể lưu bậc thang.');
          }
        showToast('success', 'Cấu hình biểu giá bậc thang thành công!');
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
    const maxStep = Math.max(...currentTiers.map(t => t.step));
    if (stepNum !== maxStep) {
      showToast('error', 'Bạn chỉ được phép xóa bậc thang cao nhất (bậc cuối cùng) để đảm bảo tính liên tục của chỉ số!');
      return;
    }

    if (window.confirm(`Bạn có chắc chắn muốn xóa Bậc ${stepNum}?`)) {
      let updatedTiers = currentTiers.filter(t => t.step !== stepNum);
      // Ensure the new last step's "to" value is open-ended (null)
      if (updatedTiers.length > 0) {
        updatedTiers = updatedTiers.map(t => t.step === maxStep - 1 ? { ...t, to: null } : t);
      }
      saveTiersToBackend(key, updatedTiers);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'system', label: 'Cấu hình chung & Bậc thang', icon: Settings },
    { id: 'fees', label: 'Danh mục Phí', icon: CreditCard },
    { id: 'services', label: 'Dịch vụ Đăng ký', icon: FileText },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>

      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Cấu Hình Tài Chính</h1>
          <p className="page-subtitle">
            Thiết lập hệ thống biểu phí dịch vụ, hóa đơn, và biểu giá điện nước hình bậc thang.
          </p>
        </div>
        <div className="page-actions"></div>
      </div>

      {/* Mock Mode Alert */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={17} className="alert-icon" />
          <span>
            <strong>Chế độ mô phỏng:</strong> Không thể kết nối tới Backend. Mọi thay đổi về cấu hình
            giá, bậc thang hay dịch vụ sẽ chỉ được lưu tạm thời trên giao diện.
          </span>
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
      <div className="tab-bar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn${activeTab === tab.id ? ' active' : ''}`}
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
          <span className="loading-text">Đang tải dữ liệu cấu hình tài chính...</span>
        </div>
      ) : (
        <div style={{ width: '100%' }}>

          {/* ─── TAB 1: SYSTEM CONFIG & UTILITY TIERS ─── */}
          {activeTab === 'system' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

              {/* System Config Cards */}
              <div className="card-padded">
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
                      Tham Số Cấu Hình Hệ Thống
                    </h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '1px' }}>
                      Các biến toàn cục điều khiển hành vi tài chính của hệ thống.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveAllConfigs}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                    
                    {/* Nhóm Chu kỳ & Thanh toán */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><Receipt size={16}/> Chu kỳ & Thanh toán</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>Ngày chốt sổ sinh hóa đơn (từ mùng 1 đến 28)</label>
                          <input type="number" min="1" max="28" required className="form-input" style={{ width: '100%' }} value={configForm.auto_invoice_day} onChange={e => setConfigForm({...configForm, auto_invoice_day: e.target.value})} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>Thời hạn thanh toán hóa đơn (số ngày)</label>
                          <input type="number" min="1" required className="form-input" style={{ width: '100%' }} value={configForm.invoice_due_days} onChange={e => setConfigForm({...configForm, invoice_due_days: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm Thông báo & Chế tài */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--danger)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={16}/> Thông báo & Chế tài</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>Nhắc nhở trước hạn chót (số ngày)</label>
                          <input type="number" min="0" required className="form-input" style={{ width: '100%' }} value={configForm.reminder_days_before_due} onChange={e => setConfigForm({...configForm, reminder_days_before_due: e.target.value})} />
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>Lãi suất phạt trễ hạn (% / ngày)</label>
                          <input type="number" step="0.01" min="0" required className="form-input" style={{ width: '100%' }} value={configForm.late_penalty_rate_per_day} onChange={e => setConfigForm({...configForm, late_penalty_rate_per_day: e.target.value})} />
                        </div>
                      </div>
                    </div>

                    {/* Nhóm Thuế & Phí chung */}
                    <div style={{ padding: '16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--warning)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}><CreditCard size={16}/> Thuế & Phí chung</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 13, marginBottom: 4 }}>Thuế giá trị gia tăng - VAT (%)</label>
                          <input type="number" min="0" max="100" required className="form-input" style={{ width: '100%' }} value={configForm.vat_tax_rate} onChange={e => setConfigForm({...configForm, vat_tax_rate: e.target.value})} />
                        </div>
                      </div>
                    </div>

                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Save size={16} /> Lưu Cấu Hình Hệ Thống
                    </button>
                  </div>
                </form>
              </div>

              {/* Utility Tiers — side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '22px' }}>

                {/* Electricity Tiers */}
                <div className="card-padded">
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
                          Biểu Giá Điện Bậc Thang
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          Đơn vị: đ/kWh
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTierKey('electricity_tiers');
                        setNewTierPrice(2000);
                        setNewTierLimit('');
                        setActiveModal('tier_add');
                      }}
                    >
                      <Plus size={13} />
                      Thêm bậc
                    </button>
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bậc</th>
                        <th>Từ (kWh)</th>
                        <th>Đến (kWh)</th>
                        <th className="text-right">Đơn giá</th>
                        <th className="text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {electricTiers.map(t => (
                        <tr key={t.step}>
                          <td>
                            <span className="badge badge-warning">Bậc {t.step}</span>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{t.from}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {t.to === null ? <span className="badge badge-neutral">Vô hạn</span> : t.to}
                          </td>
                          <td className="text-right" style={{ fontWeight: '700', color: 'var(--warning)' }}>
                            {t.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="text-right">
                            {t.step === electricTiers.length && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => deleteTierStep('electricity_tiers', t.step)}
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
                <div className="card-padded">
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
                          Biểu Giá Nước Bậc Thang
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1px' }}>
                          Đơn vị: đ/m³
                        </p>
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setSelectedTierKey('water_tiers');
                        setNewTierPrice(12000);
                        setNewTierLimit('');
                        setActiveModal('tier_add');
                      }}
                    >
                      <Plus size={13} />
                      Thêm bậc
                    </button>
                  </div>

                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Bậc</th>
                        <th>Từ (m³)</th>
                        <th>Đến (m³)</th>
                        <th className="text-right">Đơn giá</th>
                        <th className="text-right">Xóa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {waterTiers.map(t => (
                        <tr key={t.step}>
                          <td>
                            <span className="badge badge-info">Bậc {t.step}</span>
                          </td>
                          <td style={{ fontWeight: '600', color: 'var(--text-title)' }}>{t.from}</td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            {t.to === null ? <span className="badge badge-neutral">Vô hạn</span> : t.to}
                          </td>
                          <td className="text-right" style={{ fontWeight: '700', color: 'var(--info)' }}>
                            {t.price.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="text-right">
                            {t.step === waterTiers.length && (
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => deleteTierStep('water_tiers', t.step)}
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
            <div className="card-padded">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                    Quản Lý Danh Mục Loại Phí
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {feeTypes.length} loại phí đã được cấu hình trong hệ thống.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedItem(null);
                    resetFeeForm({ name: '', unit: '', description: '' });
                    setActiveModal('fee');
                  }}
                >
                  <Plus size={14} />
                  Thêm loại phí
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Phí</th>
                    <th>Tên Loại Phí</th>
                    <th>Đơn vị tính</th>
                    <th>Mô tả chi tiết</th>
                    <th className="text-right">Thao tác</th>
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
                          ? <span className="badge badge-neutral">{f.unit}</span>
                          : <span style={{ color: 'var(--text-placeholder)' }}>—</span>}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{f.description}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedItem(f);
                              resetFeeForm({ name: f.name, unit: f.unit, description: f.description || '' });
                              setActiveModal('fee');
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedItem(f);
                              setActiveModal('confirm_delete_fee');
                            }}
                            title="Xóa"
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
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setFeeTypesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={feeTypesPage === 1}
                    >
                      Trước
                    </button>
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
                      className="btn btn-secondary btn-sm" 
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
            <div className="card-padded">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-title)', letterSpacing: '-0.02em' }}>
                    Danh Mục Dịch Vụ Đăng Ký
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {services.length} dịch vụ đang hoạt động trong hệ thống.
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setSelectedItem(null);
                    setServiceForm({ name: '', description: '', price: 50000, billingCycle: 'Monthly', feeTypeId: feeTypes[0]?.feeTypeId || 1, isActive: true });
                    setActiveModal('service');
                  }}
                >
                  <Plus size={14} />
                  Thêm dịch vụ
                </button>
              </div>

              <table className="data-table">
                <thead>
                  <tr>
                    <th>Tên Dịch Vụ</th>
                    <th>Loại phí xuất HĐ</th>
                    <th>Chu kỳ</th>
                    <th className="text-right">Đơn giá dịch vụ</th>
                    <th>Mô tả</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
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
                        <span className="badge badge-neutral">
                          {s.billingCycle === 'Monthly' ? 'Hàng tháng' : s.billingCycle === 'One-time' ? 'Một lần' : 'Hàng năm'}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        {s.price.toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.description}</td>
                      <td>
                        {s.isActive !== false ? (
                          <span className="badge badge-success" style={{ backgroundColor: '#e6f4ea', color: '#137333' }}>Đang hoạt động</span>
                        ) : (
                          <span className="badge badge-neutral" style={{ backgroundColor: '#f1f3f4', color: '#5f6368' }}>Ngừng hoạt động</span>
                        )}
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedItem(s);
                              setServiceForm({ name: s.name, description: s.description || '', price: s.price, billingCycle: s.billingCycle, feeTypeId: s.feeTypeId, isActive: s.isActive ?? true });
                              setActiveModal('service');
                            }}
                            title="Chỉnh sửa"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--danger)' }}
                            onClick={() => {
                              setSelectedItem(s);
                              setActiveModal('confirm_delete_srv');
                            }}
                            title="Ngừng hoạt động"
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
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setServicesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={servicesPage === 1}
                    >
                      Trước
                    </button>
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
                      className="btn btn-secondary btn-sm" 
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
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedItem ? 'Chỉnh sửa loại phí' : 'Thêm loại phí mới'}
              </h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleFeeSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="mb-3">
                  <label className="form-label">Tên khoản phí <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${feeErrors.name ? 'is-invalid' : ''}`}
                    {...registerFee('name')}
                  />
                  {feeErrors.name && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.name.message}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Đơn vị tính (VD: kWh, m3, tháng) <span className="text-danger">*</span></label>
                  <input 
                    type="text" 
                    className={`form-input ${feeErrors.unit ? 'is-invalid' : ''}`}
                    {...registerFee('unit')}
                  />
                  {feeErrors.unit && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.unit.message}</div>}
                </div>
                <div className="mb-3">
                  <label className="form-label">Mô tả</label>
                  <textarea 
                    className={`form-textarea ${feeErrors.description ? 'is-invalid' : ''}`}
                    rows="3" 
                    {...registerFee('description')}
                  ></textarea>
                  {feeErrors.description && <div style={{ color: 'var(--danger)', fontSize: '0.85rem' }}>{feeErrors.description.message}</div>}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Confirm Delete Fee Type */}
      {activeModal === 'confirm_delete_fee' && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h2 className="modal-title">Xác nhận xóa loại phí</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                <AlertTriangle size={17} className="alert-icon" />
                <span>
                  Bạn có chắc chắn muốn xóa loại phí <strong>"{selectedItem.name}"</strong>?
                  Thao tác này có thể ảnh hưởng đến các hóa đơn lịch sử liên kết.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Hủy</button>
              <button className="btn btn-danger" onClick={deleteFeeType}>
                <Trash2 size={14} />
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Modal: Add / Edit Service */}
      {activeModal === 'service' && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">
                {selectedItem ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}
              </h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleServiceSubmit}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="form-label">Tên dịch vụ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    maxLength={150}
                    value={serviceForm.name}
                    onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                    placeholder="Tên dịch vụ..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Đơn giá dịch vụ (VNĐ) <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      className="form-input"
                      type="number"
                      required
                      min={0}
                      value={serviceForm.price}
                      onChange={e => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className="form-label">Chu kỳ tính phí</label>
                    <select
                      className="form-select"
                      value={serviceForm.billingCycle}
                      onChange={e => setServiceForm({ ...serviceForm, billingCycle: e.target.value })}
                    >
                      <option value="Monthly">Hàng tháng (Monthly)</option>
                      <option value="One-time">Một lần (One-time)</option>
                      <option value="Yearly">Hàng năm (Yearly)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Loại phí liên kết xuất hóa đơn</label>
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
                    <label className="form-label">Trạng thái hoạt động</label>
                    <select
                      className="form-select"
                      value={serviceForm.isActive ? "true" : "false"}
                      onChange={e => setServiceForm({ ...serviceForm, isActive: e.target.value === "true" })}
                    >
                      <option value="true">Đang hoạt động</option>
                      <option value="false">Ngừng hoạt động</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">Mô tả dịch vụ</label>
                  <textarea
                    className="form-textarea"
                    value={serviceForm.description}
                    maxLength={500}
                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả chi tiết dịch vụ..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  Lưu dịch vụ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Modal: Confirm Delete Service */}
      {activeModal === 'confirm_delete_srv' && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h2 className="modal-title">Xác nhận ngừng dịch vụ</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                  <AlertTriangle size={16} className="alert-icon" style={{ flexShrink: 0 }} />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-warning" style={{ marginBottom: 0 }}>
                <AlertTriangle size={17} className="alert-icon" />
                <div>
                  <p>Bạn có chắc chắn muốn ngừng hoạt động dịch vụ <strong>"{selectedItem.name}"</strong>?</p>
                  <p style={{ marginTop: '6px', fontSize: '12.5px', opacity: 0.85 }}>
                    Hệ thống sẽ đặt trạng thái ẩn dịch vụ này khỏi việc đăng ký mới.
                  </p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Hủy</button>
              <button className="btn btn-danger" onClick={deleteService}>
                <Trash2 size={14} />
                Ngừng hoạt động
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Edit System Config */}
      {activeModal === 'sys_edit' && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h2 className="modal-title">Chỉnh sửa tham số hệ thống</h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleSysSubmit}>
              <div className="modal-body">
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
                    Khóa cấu hình
                  </span>
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
                  <label className="form-label">Giá trị thiết lập <span style={{ color: 'var(--danger)' }}>*</span></label>
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
                      className="form-input"
                      type="text"
                      required
                      maxLength={255}
                      value={sysForm.configValue}
                      onChange={e => setSysForm({ ...sysForm, configValue: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  <Save size={14} />
                  Lưu cấu hình
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Modal: Add Tier Step */}
      {activeModal === 'tier_add' && (
        <div className="modal-overlay">
          <div className="modal-container modal-container-sm">
            <div className="modal-header">
              <h2 className="modal-title">
                Thêm bậc giá {selectedTierKey === 'electricity_tiers' ? 'Điện' : 'Nước'} mới
              </h2>
              <button className="modal-close-btn" onClick={closeModal}>
                <X size={17} />
              </button>
            </div>
            {(() => {
              const currentTiers = selectedTierKey === 'electricity_tiers' ? electricTiers : waterTiers;
              const hasTiers = currentTiers.length > 0;
              const lastStep = hasTiers ? currentTiers[currentTiers.length - 1] : null;

              return (
                <form onSubmit={handleAddTierStep}>
                  <div className="modal-body">
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
                          <span><strong>Cập nhật bậc thang:</strong></span>
                        </div>
                        <span style={{ fontSize: '12.5px' }}>
                          Bậc {lastStep.step} hiện tại (từ {lastStep.from} đến Vô cùng) sẽ được gán giới hạn kết thúc mới.
                          Bậc {lastStep.step + 1} mới sẽ tự động được tạo và áp dụng từ giới hạn đó + 1 đến **Vô cùng**.
                        </span>
                      </div>
                    ) : (
                      <div className="alert alert-info">
                        <Info size={16} className="alert-icon" />
                        <span>Bậc đầu tiên (Bậc 1) sẽ tự động bắt đầu từ 0 đến Vô cùng.</span>
                      </div>
                    )}

                    {hasTiers && (
                      <div>
                        <label className="form-label">
                          Giới hạn kết thúc mới cho Bậc {lastStep.step} <span style={{ color: 'var(--danger)' }}>*</span>
                        </label>
                        <input
                          className="form-input"
                          type="number"
                          required
                          min={lastStep.from + 1}
                          placeholder={`Nhập số lớn hơn ${lastStep.from}`}
                          value={newTierLimit}
                          onChange={e => setNewTierLimit(e.target.value)}
                        />
                      </div>
                    )}

                    <div>
                      <label className="form-label">
                        Đơn giá áp dụng cho {hasTiers ? `Bậc ${lastStep.step + 1} mới (từ ${newTierLimit ? parseInt(newTierLimit) + 1 : '...'} trở đi)` : 'Bậc 1 (từ 0 trở đi)'} (đ/{selectedTierKey === 'electricity_tiers' ? 'kWh' : 'm³'}) <span style={{ color: 'var(--danger)' }}>*</span>
                      </label>
                      <input
                        className="form-input"
                        type="number"
                        required
                        min="0"
                        placeholder="Nhập đơn giá..."
                        value={newTierPrice}
                        onChange={e => setNewTierPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={closeModal}>Hủy</button>
                    <button type="submit" className="btn btn-primary">
                      <Plus size={14} />
                      Xác nhận thêm bậc
                    </button>
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
