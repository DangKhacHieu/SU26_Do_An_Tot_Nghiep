import React, { useState, useEffect } from 'react';
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
  X
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

  // Modal control
  const [activeModal, setActiveModal] = useState(null); // 'fee', 'service', 'tier_add', 'tier_edit', 'sys_edit', 'confirm_delete_fee', 'confirm_delete_srv'
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedTierKey, setSelectedTierKey] = useState('electricity_tiers'); // 'electricity_tiers' | 'water_tiers'

  // Form states
  const [feeForm, setFeeForm] = useState({ name: '', unit: '', description: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', description: '', price: 0, billingCycle: 'Monthly', feeTypeId: 1 });
  const [sysForm, setSysForm] = useState({ configKey: '', configValue: '', description: '' });
  
  // Tier forms
  const [newTierPrice, setNewTierPrice] = useState(1000);
  const [newTierLimit, setNewTierLimit] = useState('');

  // Helper to show toast
  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch all config data
  const loadAllConfigData = () => {
    setLoading(true);
    setIsMock(false);

    Promise.all([
      fetch('http://localhost:5056/api/accountant/config/fee-types').then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/services').then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/system-configs').then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/tiers/electricity_tiers').then(r => r.json()),
      fetch('http://localhost:5056/api/accountant/config/tiers/water_tiers').then(r => r.json())
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
    { step: 3, from: 21, to: null, price: 22000 },
  ];

  // --- CRUD OPERATORS ---

  // 1. Fee Types
  const handleFeeSubmit = (e) => {
    e.preventDefault();
    if (!feeForm.name || !feeForm.name.trim()) {
      showToast('error', 'Tên loại phí không được để trống.');
      return;
    }
    if (!feeForm.unit || !feeForm.unit.trim()) {
      showToast('error', 'Đơn vị tính không được để trống.');
      return;
    }

    const isEdit = !!selectedItem;
    const url = isEdit ? `http://localhost:5056/api/accountant/config/fee-types/${selectedItem.feeTypeId}` : 'http://localhost:5056/api/accountant/config/fee-types';
    const method = isEdit ? 'PUT' : 'POST';

    if (isMock) {
      if (isEdit) {
        setFeeTypes(feeTypes.map(f => f.feeTypeId === selectedItem.feeTypeId ? { ...f, ...feeForm } : f));
      } else {
        setFeeTypes([...feeTypes, { feeTypeId: Math.floor(Math.random() * 100) + 10, ...feeForm }]);
      }
      showToast('success', 'Đã cập nhật loại phí (Mock)!');
      setActiveModal(null);
    } else {
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feeForm)
      })
      .then(res => {
        if (!res.ok) throw new Error('Thao tác thất bại');
        showToast('success', 'Cập nhật loại phí thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
    }
  };

  const deleteFeeType = () => {
    if (isMock) {
      setFeeTypes(feeTypes.filter(f => f.feeTypeId !== selectedItem.feeTypeId));
      showToast('success', 'Đã xóa loại phí (Mock)!');
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/config/fee-types/${selectedItem.feeTypeId}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Không thể xóa loại phí này.');
        showToast('success', 'Xóa loại phí thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
    }
  };

  // 2. Services
  const handleServiceSubmit = (e) => {
    e.preventDefault();
    if (!serviceForm.name || !serviceForm.name.trim()) {
      showToast('error', 'Tên dịch vụ không được để trống.');
      return;
    }
    if (serviceForm.price < 0) {
      showToast('error', 'Đơn giá dịch vụ phải lớn hơn hoặc bằng 0.');
      return;
    }
    if (!serviceForm.feeTypeId || serviceForm.feeTypeId <= 0) {
      showToast('error', 'Vui lòng chọn loại phí liên kết.');
      return;
    }

    const isEdit = !!selectedItem;
    const url = isEdit ? `http://localhost:5056/api/accountant/config/services/${selectedItem.serviceId}` : 'http://localhost:5056/api/accountant/config/services';
    const method = isEdit ? 'PUT' : 'POST';

    const reqData = isEdit ? { ...serviceForm, isActive: true } : { ...serviceForm, createdByUserId: 1 };

    if (isMock) {
      const mappedTypeName = feeTypes.find(f => f.feeTypeId === parseInt(serviceForm.feeTypeId))?.name || 'Phí dịch vụ';
      if (isEdit) {
        setServices(services.map(s => s.serviceId === selectedItem.serviceId ? { ...s, ...serviceForm, feeTypeName: mappedTypeName } : s));
      } else {
        setServices([...services, { serviceId: Math.floor(Math.random() * 100) + 10, ...serviceForm, feeTypeName: mappedTypeName, isActive: true }]);
      }
      showToast('success', 'Đã cập nhật dịch vụ (Mock)!');
      setActiveModal(null);
    } else {
      fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqData)
      })
      .then(res => {
        if (!res.ok) throw new Error('Thao tác thất bại');
        showToast('success', 'Cập nhật dịch vụ thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
    }
  };

  const deleteService = () => {
    if (isMock) {
      setServices(services.filter(s => s.serviceId !== selectedItem.serviceId));
      showToast('success', 'Đã xóa dịch vụ (Mock)!');
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/config/services/${selectedItem.serviceId}`, { method: 'DELETE' })
      .then(res => {
        if (!res.ok) throw new Error('Không thể xóa dịch vụ này.');
        showToast('success', 'Xóa dịch vụ thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
    }
  };

  // 3. System Config
  const handleSysSubmit = (e) => {
    e.preventDefault();
    if (!sysForm.configValue || !sysForm.configValue.trim()) {
      showToast('error', 'Giá trị cấu hình không được để trống.');
      return;
    }
    const val = sysForm.configValue.trim();
    if (sysForm.configKey === 'invoice_due_days') {
      const parsed = parseInt(val);
      if (isNaN(parsed) || parsed <= 0) {
        showToast('error', 'Số ngày hạn thanh toán hóa đơn phải là số nguyên dương.');
        return;
      }
    } else if (sysForm.configKey === 'vat_rate') {
      const parsed = parseFloat(val);
      if (isNaN(parsed) || parsed < 0 || parsed > 100) {
        showToast('error', 'Thuế suất VAT phải nằm trong khoảng 0% đến 100%.');
        return;
      }
    } else if (sysForm.configKey === 'auto_invoice_day') {
      const parsed = parseInt(val);
      if (isNaN(parsed) || parsed < 1 || parsed > 28) {
        showToast('error', 'Ngày tự động xuất hóa đơn phải nằm trong khoảng từ 1 đến 28.');
        return;
      }
    }

    if (isMock) {
      setSystemConfigs(systemConfigs.map(c => c.configKey === sysForm.configKey ? { ...c, configValue: sysForm.configValue } : c));
      showToast('success', 'Đã lưu cấu hình (Mock)!');
      setActiveModal(null);
    } else {
      fetch('http://localhost:5056/api/accountant/config/system-configs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configKey: sysForm.configKey,
          configValue: sysForm.configValue,
          updatedByUserId: 1
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Thất bại');
        showToast('success', 'Cập nhật cấu hình thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
    }
  };

  // 4. Adding Utility Tier Step (Incremental validation)
  const handleAddTierStep = (e) => {
    e.preventDefault();
    const isElectric = selectedTierKey === 'electricity_tiers';
    const currentTiers = isElectric ? electricTiers : waterTiers;
    const maxStep = currentTiers.length > 0 ? Math.max(...currentTiers.map(t => t.step)) : 0;
    
    // Calculate From value automatically
    let fromVal = 0;
    if (currentTiers.length > 0) {
      const lastStep = currentTiers.find(t => t.step === maxStep);
      if (!lastStep || lastStep.to === null) {
        showToast('error', 'Bậc cuối hiện tại đang là Vô hạn (Null). Hãy chỉnh sửa giới hạn của bậc trước trước khi thêm bậc mới!');
        return;
      }
      fromVal = lastStep.to + 1;
    }

    const toVal = newTierLimit !== '' ? parseFloat(newTierLimit) : null;
    if (toVal !== null && toVal <= fromVal) {
      showToast('error', `Chỉ số giới hạn kết thúc (${toVal}) phải lớn hơn chỉ số bắt đầu (${fromVal})!`);
      return;
    }

    const newStep = {
      step: maxStep + 1,
      from: fromVal,
      to: toVal,
      price: parseFloat(newTierPrice)
    };

    const updatedTiers = [...currentTiers, newStep];
    saveTiersToBackend(selectedTierKey, updatedTiers);
  };

  const saveTiersToBackend = (key, stepsList) => {
    if (isMock) {
      if (key === 'electricity_tiers') setElectricTiers(stepsList);
      else setWaterTiers(stepsList);
      showToast('success', 'Đã cập nhật biểu giá bậc thang (Mock)!');
      setActiveModal(null);
    } else {
      fetch('http://localhost:5056/api/accountant/config/tiers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configKey: key,
          steps: stepsList,
          updatedByUserId: 1
        })
      })
      .then(res => {
        if (!res.ok) throw new Error('Không thể lưu bậc thang');
        showToast('success', 'Cấu hình biểu giá bậc thang thành công!');
        setActiveModal(null);
        loadAllConfigData();
      })
      .catch(err => showToast('error', err.message));
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
      const updatedTiers = currentTiers.filter(t => t.step !== stepNum);
      // Ensure the new last step's "to" value is open-ended (null) if desired, or let users edit it later
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

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
                  {systemConfigs.map(cfg => (
                    <div
                      key={cfg.configId}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '18px 20px',
                        backgroundColor: 'var(--bg-base)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        gap: '16px',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '700',
                          color: 'var(--primary)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          fontFamily: "'SF Mono', 'Fira Code', monospace",
                        }}>
                          {cfg.configKey}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          {cfg.description}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '24px',
                          fontWeight: '800',
                          color: 'var(--text-title)',
                          letterSpacing: '-0.04em',
                          lineHeight: '1',
                        }}>
                          {cfg.configValue}
                        </span>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setSelectedItem(cfg);
                            setSysForm({ configKey: cfg.configKey, configValue: cfg.configValue, description: cfg.description });
                            setActiveModal('sys_edit');
                          }}
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
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
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => deleteTierStep('electricity_tiers', t.step)}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
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
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => deleteTierStep('water_tiers', t.step)}
                              style={{ color: 'var(--danger)' }}
                            >
                              <Trash2 size={13} />
                            </button>
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
                    setFeeForm({ name: '', unit: '', description: '' });
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
                              setFeeForm({ name: f.name, unit: f.unit || '', description: f.description || '' });
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
                    setServiceForm({ name: '', description: '', price: 50000, billingCycle: 'Monthly', feeTypeId: feeTypes[0]?.feeTypeId || 1 });
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
                    <th className="text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {services.slice((servicesPage - 1) * itemsPerPage, servicesPage * itemsPerPage).map(s => (
                    <tr key={s.serviceId}>
                      <td style={{ fontWeight: '700', color: 'var(--text-title)' }}>{s.name}</td>
                      <td>
                        <span className="badge badge-primary">{s.feeTypeName}</span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">
                          {s.billingCycle === 'Monthly' ? 'Hàng tháng' : s.billingCycle}
                        </span>
                      </td>
                      <td className="text-right" style={{ fontWeight: '800', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
                        {s.price.toLocaleString('vi-VN')} ₫
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{s.description}</td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => {
                              setSelectedItem(s);
                              setServiceForm({ name: s.name, description: s.description || '', price: s.price, billingCycle: s.billingCycle, feeTypeId: s.feeTypeId });
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleFeeSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Tên loại phí <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    required
                    value={feeForm.name}
                    onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                    placeholder="Ví dụ: Tiền phạt, Phí bảo vệ..."
                  />
                </div>
                <div>
                  <label className="form-label">Đơn vị tính</label>
                  <input
                    className="form-input"
                    type="text"
                    value={feeForm.unit}
                    onChange={e => setFeeForm({ ...feeForm, unit: e.target.value })}
                    placeholder="Ví dụ: Tháng, Cái, Lần..."
                  />
                </div>
                <div>
                  <label className="form-label">Mô tả ý nghĩa</label>
                  <textarea
                    className="form-textarea"
                    value={feeForm.description}
                    onChange={e => setFeeForm({ ...feeForm, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả ngắn gọn về loại phí này..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
              <div className="alert alert-danger" style={{ marginBottom: 0 }}>
                <AlertTriangle size={17} className="alert-icon" />
                <span>
                  Bạn có chắc chắn muốn xóa loại phí <strong>"{selectedItem.name}"</strong>?
                  Thao tác này có thể ảnh hưởng đến các hóa đơn lịch sử liên kết.
                </span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleServiceSubmit}>
              <div className="modal-body">
                <div>
                  <label className="form-label">Tên dịch vụ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    className="form-input"
                    type="text"
                    required
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

                <div>
                  <label className="form-label">Mô tả dịch vụ</label>
                  <textarea
                    className="form-textarea"
                    value={serviceForm.description}
                    onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                    rows={3}
                    placeholder="Mô tả chi tiết dịch vụ..."
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <div className="modal-body">
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
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleSysSubmit}>
              <div className="modal-body">
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
                      value={sysForm.configValue}
                      onChange={e => setSysForm({ ...sysForm, configValue: e.target.value })}
                    />
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
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
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}>
                <X size={17} />
              </button>
            </div>
            <form onSubmit={handleAddTierStep}>
              <div className="modal-body">
                <div className="alert alert-info" style={{ marginBottom: 0 }}>
                  <Info size={16} className="alert-icon" />
                  <span>
                    Chỉ số bắt đầu của bậc này sẽ tự động được gán bằng chỉ số kết thúc của bậc trước + 1.
                  </span>
                </div>

                <div>
                  <label className="form-label">Chỉ số giới hạn kết thúc (To)</label>
                  <input
                    className="form-input"
                    type="number"
                    placeholder="Để trống nếu là bậc không giới hạn (Vô hạn)"
                    value={newTierLimit}
                    onChange={e => setNewTierLimit(e.target.value)}
                  />
                </div>

                <div>
                  <label className="form-label">
                    Đơn giá áp dụng (đ/{selectedTierKey === 'electricity_tiers' ? 'kWh' : 'm³'}) <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    className="form-input"
                    type="number"
                    required
                    value={newTierPrice}
                    onChange={e => setNewTierPrice(parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={14} />
                  Xác nhận thêm bậc
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
