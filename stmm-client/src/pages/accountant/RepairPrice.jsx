import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Plus, Search, Edit3, Trash2, AlertTriangle,
  RefreshCw, Wrench, History, X, AlertCircle,
  CheckCircle, FileText
} from 'lucide-react';

const getCategoryBadge = (name, t) => {
  const n = name.toLowerCase();
  if (n.includes('Điện') || n.includes('bóng đèn') || n.includes('led') || n.includes('ổ cắm')) return { cls: 'badge badge-warning', label: t('repairprice.electricity_category') };
  if (n.includes('Nước') || n.includes('vòi') || n.includes('ống') || n.includes('thoát')) return { cls: 'badge badge-info', label: t('repairprice.water_category') };
  return { cls: 'badge badge-neutral', label: t('repairprice.construction_category') };
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()} ${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
};

export default function RepairPrice() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('prices');
  const [searchTerm, setSearchTerm] = useState('');
  const [repairItems, setRepairItems] = useState([]);
  const [usedTools, setUsedTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);

  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [formState, setFormState] = useState({ itemName: '', unit: t('repairprice.female'), price: 0, description: '', isActive: true });
  const [modalError, setModalError] = useState(null);

  const [pricesPage, setPricesPage] = useState(1);
  const [usedPage, setUsedPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setPricesPage(1);
    setUsedPage(1);
  }, [searchTerm, activeTab]);

  useEffect(() => {
    setModalError(null);
  }, [activeModal]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = () => {
    setLoading(true); 
    Promise.all([
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/accountant/repair-prices`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/accountant/repair-prices/used-tools`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); return r.json(); })
    ])
      .then(([prices, used]) => { setRepairItems(prices); setUsedTools(used); setLoading(false); })
      .catch(() => {
        setTimeout(() => { setRepairItems(getMockPrices()); setUsedTools(getMockUsedTools()); setIsMock(true); setLoading(false); }, 500);
      });
  };

  useEffect(() => { loadData(); }, []);

  const getMockPrices = () => [
    { repairPriceId: 1, itemName: t('repairprice.replace_12m_led_bulb'), unit: t('repairprice.female'), price: 150000, description: t('repairprice.includes_light_bulbs_and'), isActive: true, usageCount: 15 },
    { repairPriceId: 2, itemName: t('repairprice.repair_leaking_faucets'), unit: t('repairprice.time'), price: 80000, description: t('repairprice.additional_materials_are_not'), isActive: true, usageCount: 8 },
    { repairPriceId: 3, itemName: t('repairprice.reinstall_the_wall_electrical'), unit: t('repairprice.female'), price: 120000, description: t('repairprice.includes_panasonic_standard_socket'), isActive: true, usageCount: 4 },
    { repairPriceId: 4, itemName: t('repairprice.repair_hydraulic_glass_door'), unit: t('repairprice.female'), price: 350000, description: t('repairprice.repair_warranty_within_3'), isActive: true, usageCount: 1 },
    { repairPriceId: 5, itemName: t('repairprice.unclogging_wastewater_pipes'), unit: t('repairprice.meter'), price: 100000, description: t('repairprice.calculated_according_to_actual'), isActive: false, usageCount: 0 },
  ];

  const getMockUsedTools = () => [
    { id: 101, taskId: 12, taskTitle: t('repairprice.repair_power_lines_kiosk'), assignedToStaff: t('repairprice.nguyen_van_hung_engineering'), repairPriceId: 1, itemName: t('repairprice.replace_12m_led_bulb'), quantity: 2, unit: t('repairprice.female'), unitPrice: 150000, amount: 300000, usedDate: '2026-06-03T10:30:00Z' },
    { id: 102, taskId: 15, taskTitle: t('repairprice.fix_water_leak_kiosk'), assignedToStaff: t('repairprice.tran_minh_hai_engineering'), repairPriceId: 2, itemName: t('repairprice.repair_leaking_faucets'), quantity: 1, unit: t('repairprice.time'), unitPrice: 80000, amount: 80000, usedDate: '2026-06-02T14:15:00Z' },
    { id: 103, taskId: 12, taskTitle: t('repairprice.repair_power_lines_kiosk'), assignedToStaff: t('repairprice.nguyen_van_hung_engineering'), repairPriceId: 3, itemName: t('repairprice.reinstall_the_wall_electrical'), quantity: 1, unit: t('repairprice.female'), unitPrice: 120000, amount: 120000, usedDate: '2026-06-03T10:30:00Z' },
  ];

  const filteredPrices = repairItems.filter(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || (i.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredUsed = usedTools.filter(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || i.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation for item name
    if (!formState.itemName || formState.itemName.trim() === '') {
      setModalError(t('repairprice.please_enter_item_name'));
      return;
    }
    
    // Validation for unit
    if (!formState.unit || formState.unit.trim() === '') {
      setModalError(t('repairprice.please_enter_unit') || 'Vui lòng nhập đơn vị tính.');
      return;
    }
    
    // Validation for price
    if (!formState.price || parseFloat(formState.price) <= 0) {
      setModalError(t('repairprice.price_must_be_positive'));
      return;
    }
    
    const isEdit = activeModal === 'edit';
    const url = isEdit ? `${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/accountant/repair-prices/${selectedItem.repairPriceId}` : `${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/accountant/repair-prices`;
    if (isMock) {
      if (isEdit) setRepairItems(p => p.map(i => i.repairPriceId === selectedItem.repairPriceId ? { ...i, ...formState } : i));
      else setRepairItems(p => [...p, { repairPriceId: Math.floor(Math.random() * 1000) + 10, ...formState, usageCount: 0 }]);
      showNotification('success', `${isEdit ? t('repairprice.update') : t('repairprice.more')} hạng mục thành công!`);
      setActiveModal(null);
    } else {
      setModalError(null);
      fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(formState) })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('repairprice.operation_failed'));
          } 
          showNotification('success', `${isEdit ? t('repairprice.update') : t('repairprice.more')} hạng mục thành công!`); 
          setActiveModal(null); 
          loadData(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  const handleDelete = () => {
    if (isMock) {
      if (selectedItem.usageCount > 0) {
        setModalError(t('repairprice.cannot_delete_item_used', { itemName: selectedItem.itemName }));
      } else {
        setRepairItems(p => p.filter(i => i.repairPriceId !== selectedItem.repairPriceId));
        showNotification('success', t('repairprice.repair_category_removed'));
        setActiveModal(null);
      }
    } else {
      setModalError(null);
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5056/api'}/accountant/repair-prices/${selectedItem.repairPriceId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('repairprice.item_cannot_be_deleted'));
          } 
          showNotification('success', t('repairprice.deleted_successfully')); 
          setActiveModal(null); 
          loadData(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ display: "none" }}>
        <div>
          <h1 className="page-title">{t('repairprice.repair_price_list')}</h1>
          <p className="page-subtitle">{t('repairprice.set_technical_repair_unit')}</p>
        </div>
        <div className="page-actions">
          {activeTab === 'prices' && (
            <button className="acc-btn-primary" onClick={() => { setSelectedItem(null); setFormState({ itemName: '', unit: t('repairprice.female'), price: 0, description: '', isActive: true }); setModalError(null); setActiveModal('add'); }}>
              <Plus size={15} /> {t('repairprice.add_categories')}</button>
          )}
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <AlertCircle size={16} className="alert-icon" />
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button className="acc-btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}

      {/* Mock Warning */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <span><strong>{t('repairprice.simulation_mode')}</strong> {t('repairprice.showing_simulation_data')}</span>
        </div>
      )}

      {/* Search */}
      <div className="acc-card" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={14} className="search-icon-inner" />
            <input type="text" className="search-input" style={{ width: '100%' }}
              placeholder={t('repairprice.find_names_of_materials')}
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <span className="acc-badge neutral">{t('repairprice.results_count', { count: activeTab === 'prices' ? filteredPrices.length : filteredUsed.length })}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="acc-tabs-header">
        {[{ id: 'prices', label: t('repairprice.list_of_unit_prices'), icon: Wrench }, { id: 'history', label: t('repairprice.supplies_used'), icon: History }].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`acc-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">{t('repairprice.loading_repair_data')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PRICES */}
          {activeTab === 'prices' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{t('repairprice.list_of_unit_prices')}</h3>
                <button className="acc-btn-primary btn-sm" onClick={() => { setSelectedItem(null); setFormState({ itemName: '', unit: t('repairprice.female'), price: 0, description: '', isActive: true }); setModalError(null); setActiveModal('add'); }}>
                  <Plus size={15} /> {t('repairprice.add_categories')}
                </button>
              </div>
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>{t('repairprice.name_of_material_item')}</th>
                    <th>{t('repairprice.category')}</th>
                    <th>{t('repairprice.unit')}</th>
                    <th className="text-right">{t('repairprice.unit_price')}</th>
                    <th>{t('repairprice.number_of_uses')}</th>
                    <th>{t('repairprice.describe')}</th>
                    <th>{t('repairprice.status')}</th>
                    <th className="text-right">{t('repairprice.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPrices.length > 0 ? filteredPrices.slice((pricesPage - 1) * itemsPerPage, pricesPage * itemsPerPage).map(item => {
                    const catBadge = getCategoryBadge(item.itemName, t);
                    return (
                      <tr key={item.repairPriceId} style={{ opacity: item.isActive ? 1 : 0.55 }}>
                        <td><strong style={{ fontSize: 13.5 }}>{item.itemName}</strong></td>
                        <td><span className={catBadge.cls}>{catBadge.label}</span></td>
                        <td><span className="acc-badge neutral">{item.unit}</span></td>
                        <td className="text-right"><strong style={{ color: 'var(--primary)' }}>{item.price.toLocaleString('vi-VN')} ₫</strong></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('repairprice.times_count', { count: item.usageCount || 0 })}</span></td>
                        <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{item.description || '—'}</span></td>
                        <td>
                          <span className={item.isActive ? 'badge badge-success' : 'badge badge-neutral'}>
                            {item.isActive ? t('repairprice.work') : t('repairprice.stop')}
                          </span>
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="acc-btn-ghost btn-sm btn-icon" title={t('repairprice.update')} onClick={() => { setSelectedItem(item); setFormState({ itemName: item.itemName, unit: item.unit, price: item.price, description: item.description || '', isActive: item.isActive }); setActiveModal('edit'); }}>
                              <Edit3 size={14} />
                            </button>
                            <button className="acc-btn-ghost btn-sm btn-icon" title={t('repairprice.erase')} style={{ color: 'var(--danger)' }} onClick={() => { setSelectedItem(item); setActiveModal('delete'); }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><Wrench size={24} /></div><p className="empty-state-title">{t('repairprice.there_are_no_categories')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredPrices.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {t('repairprice.show_paginated_prices', { start: ((pricesPage - 1) * itemsPerPage) + 1, end: Math.min(pricesPage * itemsPerPage, filteredPrices.length), total: filteredPrices.length })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setPricesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={pricesPage === 1}
                    >
                      {t('repairprice.before')}</button>
                    {Array.from({ length: Math.ceil(filteredPrices.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${pricesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPricesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setPricesPage(prev => Math.min(prev + 1, Math.ceil(filteredPrices.length / itemsPerPage)))} 
                      disabled={pricesPage === Math.ceil(filteredPrices.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USED TOOLS */}
          {activeTab === 'history' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>{t('repairprice.coupon_code')}</th>
                    <th>{t('repairprice.repair_work')}</th>
                    <th>{t('repairprice.technical_staff')}</th>
                    <th>{t('repairprice.materials_used')}</th>
                    <th className="text-right">{t('repairprice.quantity')}</th>
                    <th className="text-right">{t('repairprice.unit_price')}</th>
                    <th className="text-right">{t('repairprice.make_money')}</th>
                    <th>{t('repairprice.time')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsed.length > 0 ? filteredUsed.slice((usedPage - 1) * itemsPerPage, usedPage * itemsPerPage).map(tool => (
                    <tr key={tool.id}>
                      <td><span style={{ fontFamily: 'monospace', fontSize: 12.5, color: 'var(--text-muted)' }}>#{tool.id}</span></td>
                      <td><strong style={{ fontSize: 13 }}>{tool.taskTitle}</strong></td>
                      <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{tool.assignedToStaff}</span></td>
                      <td><span className="badge badge-primary">{tool.itemName}</span></td>
                      <td className="text-right">{tool.quantity} {tool.unit}</td>
                      <td className="text-right">{tool.unitPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="text-right"><strong style={{ color: 'var(--primary)' }}>{tool.amount.toLocaleString('vi-VN')} ₫</strong></td>
                      <td><span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatDate(tool.usedDate)}</span></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={8}><div className="empty-state"><div className="empty-state-icon"><History size={24} /></div><p className="empty-state-title">{t('repairprice.there_is_no_material')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredUsed.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {t('repairprice.display')} {((usedPage - 1) * itemsPerPage) + 1} - {Math.min(usedPage * itemsPerPage, filteredUsed.length)} {t('repairprice.out_of')} {filteredUsed.length} {t('repairprice.issued_times')}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setUsedPage(prev => Math.max(prev - 1, 1))} 
                      disabled={usedPage === 1}
                    >
                      {t('repairprice.before')}</button>
                    {Array.from({ length: Math.ceil(filteredUsed.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${usedPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setUsedPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setUsedPage(prev => Math.min(prev + 1, Math.ceil(filteredUsed.length / itemsPerPage)))} 
                      disabled={usedPage === Math.ceil(filteredUsed.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modal: Add/Edit */}
      {(activeModal === 'add' || activeModal === 'edit') && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="acc-modal-container" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{activeModal === 'edit' ? t('repairprice.edit') : t('repairprice.more')} {t('repairprice.repair_item')}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="acc-modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                    <AlertTriangle size={16} className="alert-icon" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="acc-form-label">{t('repairprice.material_name_item')}</label>
                  <input type="text" className="acc-input" required maxLength={100}
                    placeholder={t('repairprice.v_d_thay_th')}
                    value={formState.itemName} onChange={e => setFormState({ ...formState, itemName: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="acc-form-label">{t('repairprice.n_v_tnh') || 'Đơn vị tính'}</label>
                    <input type="text" className="acc-input" required maxLength={50}
                      placeholder="VD: Cái, Lần, Mét..."
                      value={formState.unit} onChange={e => setFormState({ ...formState, unit: e.target.value })} />
                  </div>
                  <div>
                    <label className="acc-form-label">{t('repairprice.unit_price_vnd')}</label>
                    <input type="number" className="acc-input" required min={0}
                      value={formState.price} onChange={e => setFormState({ ...formState, price: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                <div>
                  <label className="acc-form-label">{t('repairprice.detailed_description')}</label>
                  <textarea className="form-textarea" rows={3} maxLength={500}
                    placeholder={t('repairprice.notes_on_coverage_warranty')}
                    value={formState.description} onChange={e => setFormState({ ...formState, description: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="checkbox" id="isActive-check" checked={formState.isActive} onChange={e => setFormState({ ...formState, isActive: e.target.checked })} />
                  <label htmlFor="isActive-check" style={{ fontSize: 13.5, fontWeight: 500, cursor: 'pointer' }}>{t('repairprice.applying')}</label>
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('repairprice.cancel')}</button>
                <button type="submit" className="acc-btn-primary">{t('repairprice.save_changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Delete Confirm */}
      {activeModal === 'delete' && selectedItem && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('repairprice.confirm_deletion')}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-warning">
                <AlertTriangle size={16} className="alert-icon" />
                <div>
                  <p>{t('repairprice.you_are_about_to')}<strong>"{selectedItem.itemName}"</strong>.</p>
                  {selectedItem.usageCount > 0 && (
                    <p style={{ marginTop: 6, fontSize: 13, color: 'var(--color-danger)' }}><strong>{t('repairprice.warning')}</strong> {t('repairprice.category_used_in')} <strong>{selectedItem.usageCount}</strong> {t('repairprice.tasks_cannot_be_deleted')}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('repairprice.cancel')}</button>
              <button className="acc-btn-danger" onClick={handleDelete} disabled={selectedItem.usageCount > 0}>{t('repairprice.confirm_deletion')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
