import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Plus, Edit3, Trash2, ShieldAlert, Search, DollarSign,
  CheckCircle, Clock, AlertCircle, Eye, AlertTriangle,
  RefreshCw, Info, X, ShieldOff, FileText
} from 'lucide-react';

const getStatusBadge = (status) => {
  if (status === 'Paid') return { cls: 'badge badge-success', label: 'Đã đóng phạt' };
  if (status === 'Unpaid' || status === 'Pending') return { cls: 'badge badge-warning', label: 'Chờ duyệt' };
  if (status === 'Notified') return { cls: 'badge badge-info', label: 'Đã thông báo' };
  if (status === 'Appealed') return { cls: 'badge badge-neutral', label: 'Kháng nghị' };
  if (status === 'Approved') return { cls: 'badge badge-success', label: 'Chấp nhận KH' };
  if (status === 'Rejected') return { cls: 'badge badge-danger', label: 'Bác bỏ KH' };
  if (status === 'Finalized') return { cls: 'badge badge-neutral', label: 'Đã kết luận' };
  return { cls: 'badge badge-neutral', label: status };
};

const canCreateInvoice = (vio) => {
  if (vio.status === 'Paid' || vio.status === 'Finalized') return false;
  if (vio.status === 'Rejected') return true;
  if (vio.status === 'Notified') {
    const createdDate = new Date(vio.createdAt || vio.date);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return createdDate <= oneWeekAgo;
  }
  return false;
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

export default function ViolationsPenalties() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('violations');
  const [violations, setViolations] = useState([]);
  const [violationTypes, setViolationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [invoiceConfirmVio, setInvoiceConfirmVio] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', description: '', defaultFine: 500000, isActive: true });
  const [modalError, setModalError] = useState(null);

  const [violationsPage, setViolationsPage] = useState(1);
  const [typesPage, setTypesPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    setModalError(null);
  }, [activeModal]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAllData = () => {
    setLoading(true); setIsMock(false);
    const session = localStorage.getItem('user');
    let userIdStr = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        if (u && u.userId) userIdStr = u.userId;
      } catch (e) {}
    }
    const token = localStorage.getItem('accessToken');
    const headers = { 'Authorization': `Bearer ${token}` };
    Promise.all([
      fetch(`http://localhost:5056/api/violations/all?userId=${userIdStr}`, { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); }),
      fetch('http://localhost:5056/api/violations/types/all', { headers }).then(r => { if(!r.ok) throw new Error(); return r.json(); })
    ])
      .then(([viols, types]) => { setViolations(viols); setViolationTypes(types); setLoading(false); })
      .catch(() => {
        setTimeout(() => { setViolations(getMockViolations()); setViolationTypes(getMockTypes()); setIsMock(true); setLoading(false); }, 600);
      });
  };

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    setViolationsPage(1);
    setTypesPage(1);
  }, [searchQuery, statusFilter, activeTab]);

  const getMockViolations = () => [
    { violationId: 81, stallCode: 'Kiosk B-12', title: t('violationspenalties.encroaching_the_common_path'), description: t('violationspenalties.display_goods_50cm_beyond'), penalty: 1500000, fineAmount: 1500000, status: 'Unpaid', date: '01/06/2026', imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600', violationType: { name: t('violationspenalties.encroachment') } },
    { violationId: 79, stallCode: 'Kiosk A-03', title: t('violationspenalties.open_late_beyond_regulations'), description: t('violationspenalties.open_for_business_after'), penalty: 500000, fineAmount: 500000, status: 'Paid', date: '28/05/2026', imageUrl: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&q=80&w=600', violationType: { name: t('violationspenalties.hours') } },
    { violationId: 75, stallCode: 'Kiosk C-10', title: t('violationspenalties.arbitrarily_modify_the_structure'), description: t('violationspenalties.drilling_public_walls_and'), penalty: 5000000, fineAmount: 5000000, status: 'Unpaid', date: '20/05/2026', imageUrl: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ecc?auto=format&fit=crop&q=80&w=600', violationType: { name: t('violationspenalties.build') } },
    { violationId: 71, stallCode: 'Kiosk D-02', title: t('violationspenalties.fire_safety_is_not'), description: t('violationspenalties.pile_up_cardboard_boxes'), penalty: 3000000, fineAmount: 3000000, status: 'Paid', date: '15/05/2026', imageUrl: 'https://images.unsplash.com/photo-1599740831666-4cf92c537d7a?auto=format&fit=crop&q=80&w=600', violationType: { name: 'PCCC' } },
  ];

  const getMockTypes = () => [
    { violationTypeId: 1, name: t('violationspenalties.encroaching_the_hallway'), description: t('violationspenalties.displaying_goods_outside_the'), defaultFine: 1500000, isActive: true },
    { violationTypeId: 2, name: t('violationspenalties.hours_of_operation'), description: t('violationspenalties.open_late_after_830'), defaultFine: 500000, isActive: true },
    { violationTypeId: 3, name: t('violationspenalties.construction_regulations'), description: t('violationspenalties.arbitrarily_modifying_the_structure'), defaultFine: 5000000, isActive: true },
    { violationTypeId: 4, name: t('violationspenalties.fire_and_explosion_safety'), description: t('violationspenalties.block_fire_equipment_and'), defaultFine: 3000000, isActive: true },
  ];

  const filteredViolations = violations.filter(v => {
    const q = (searchQuery || '').toLowerCase();
    const matchSearch = (v.stallCode || '').toLowerCase().includes(q) || 
                        (v.title || '').toLowerCase().includes(q) || 
                        (v.violationTypeName || v.violationType?.name || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleTypeSubmit = (e) => {
    e.preventDefault();
    const isEdit = !!selectedItem;
    const url = isEdit ? `http://localhost:5056/api/violations/types/${selectedItem.violationTypeId}` : 'http://localhost:5056/api/violations/types';
    if (isMock) {
      if (isEdit) setViolationTypes(violationTypes.map(typeItem => typeItem.violationTypeId === selectedItem.violationTypeId ? { ...typeItem, ...typeForm } : typeItem));
      else setViolationTypes([...violationTypes, { violationTypeId: Math.floor(Math.random() * 100) + 10, ...typeForm }]);
      showNotification('success', `${isEdit ? t('violationspenalties.update') : t('violationspenalties.more')} loại vi phạm thành công!`);
      setActiveModal(null);
    } else {
      setModalError(null);
      const token = localStorage.getItem('accessToken');
      fetch(url, { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(typeForm) })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('violationspenalties.unable_to_update_violation'));
          } 
          showNotification('success', t('violationspenalties.updated_successfully')); 
          setActiveModal(null); 
          loadAllData(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  const deleteViolationType = () => {
    if (isMock) {
      setViolationTypes(violationTypes.filter(typeItem => typeItem.violationTypeId !== selectedItem.violationTypeId));
      showNotification('success', t('violationspenalties.violation_type_removed'));
      setActiveModal(null);
    } else {
      setModalError(null);
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/violations/types/${selectedItem.violationTypeId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('violationspenalties.the_deletion_operation_failed'));
          } 
          showNotification('success', t('violationspenalties.deleted_successfully')); 
          setActiveModal(null); 
          loadAllData(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  const handleCreateInvoiceClick = (vio) => {
    setInvoiceConfirmVio(vio);
  };

  const confirmCreateInvoice = () => {
    if (!invoiceConfirmVio) return;
    const violationId = invoiceConfirmVio.violationId;
    if (isMock) {
      showNotification('success', t('violationspenalties.successfully_created_penalty_invoice'));
      setInvoiceConfirmVio(null);
    } else {
      setModalError(null);
      const token = localStorage.getItem('accessToken');
      fetch(`http://localhost:5056/api/violations/${violationId}/invoice`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.message || errData.detail || errData.title || t('violationspenalties.unable_to_create_invoice'));
          } 
          showNotification('success', t('violationspenalties.created_penalty_invoice_successfully')); 
          setInvoiceConfirmVio(null);
          loadAllData(); 
        })
        .catch(e => {
            showNotification('danger', e.message);
            setInvoiceConfirmVio(null);
        });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ display: "none" }}>
        <div>
          <h1 className="page-title">{t('violationspenalties.violations_sanctions')}</h1>
          <p className="page-subtitle">{t('violationspenalties.manage_violation_records_and')}</p>
        </div>
        <div className="page-actions">
          {activeTab === 'types' && (
            <button className="acc-btn-primary" onClick={() => { setSelectedItem(null); setTypeForm({ name: '', description: '', defaultFine: 500000, isActive: true }); setModalError(null); setActiveModal('type'); }}>
              <Plus size={15} /> {t('violationspenalties.add_violation_type')}</button>
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
          <span><strong>{t('violationspenalties.simulation_mode')}</strong> {t('violationspenalties.unable_to_connect_backend')}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="acc-tabs-header">
        {[{ id: 'violations', label: t('violationspenalties.violation_minutes'), icon: ShieldAlert }, { id: 'types', label: t('violationspenalties.list_of_penalty_errors'), icon: Info }].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">{t('violationspenalties.ang_ti_d_liu')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: VIOLATIONS LIST */}
          {activeTab === 'violations' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Search & Filters */}
              <div className="acc-card" style={{ padding: "20px" }} style={{ padding: '14px 20px' }}>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
                    <Search size={14} className="search-icon-inner" />
                    <input type="text" className="search-input" style={{ width: '100%' }}
                      placeholder={t('violationspenalties.find_kiosks_violations')}
                      value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                  <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">{t('violationspenalties.mi_trng_thi')}</option>
                    <option value="Pending">{t('violationspenalties.waiting_for_approval')}</option>
                    <option value="Notified">{t('violationspenalties.notified')}</option>
                    <option value="Appealed">{t('violationspenalties.appeal')}</option>
                    <option value="Rejected">{t('violationspenalties.reject_kh_need_to')}</option>
                    <option value="Paid">{t('violationspenalties.fine_paid')}</option>
                  </select>
                  <span className="acc-badge neutral">{filteredViolations.length} biên bản</span>
                </div>
              </div>

              {/* Table */}
              {filteredViolations.length > 0 ? (
                <div className="card" style={{ overflow: 'hidden' }}>
                  <table className="acc-table">
                    <thead>
                      <tr>
                        <th>{t('violationspenalties.m_bb')}</th>
                        <th>{t('violationspenalties.booth')}</th>
                        <th>{t('violationspenalties.violations')}</th>
                        <th>{t('violationspenalties.type')}</th>
                        <th>{t('violationspenalties.date_of_establishment')}</th>
                        <th className="text-right">{t('violationspenalties.fine')}</th>
                        <th>{t('violationspenalties.status')}</th>
                        <th className="text-right">{t('violationspenalties.detail')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredViolations.slice((violationsPage - 1) * itemsPerPage, violationsPage * itemsPerPage).map(vio => {
                        const { cls, label } = getStatusBadge(vio.status);
                        return (
                          <tr key={vio.violationId}>
                            <td><span style={{ fontWeight: 600, color: 'var(--text-title)', fontFamily: 'monospace', fontSize: 13 }}>VIO-{vio.violationId}</span></td>
                            <td><strong style={{ color: 'var(--danger)' }}>{vio.stallCode}</strong></td>
                            <td><span style={{ fontWeight: 600 }}>{vio.title}</span></td>
                            <td><span className="acc-badge neutral">{vio.violationTypeName || vio.violationType?.name || '—'}</span></td>
                            <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{vio.createdAt ? formatDate(vio.createdAt) : (vio.date || '—')}</span></td>
                            <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{(vio.fineAmount || vio.penalty || 0).toLocaleString('vi-VN')} ₫</strong></td>
                            <td><span className={cls}>{label}</span></td>
                            <td className="text-right">
                              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                {canCreateInvoice(vio) && (
                                  <button 
                                    className="acc-btn-primary btn-sm" 
                                    onClick={() => handleCreateInvoiceClick(vio)}
                                    title={t('violationspenalties.create_fine_collection_invoices')}
                                  >
                                    <FileText size={13} /> {t('violationspenalties.bill')}</button>
                                )}
                                <button className="acc-btn-secondary btn-sm" onClick={() => { setSelectedItem(vio); setActiveModal('details'); }}>
                                  <Eye size={13} /> Xem
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {filteredViolations.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                        Hiển thị {((violationsPage - 1) * itemsPerPage) + 1} - {Math.min(violationsPage * itemsPerPage, filteredViolations.length)} trong tổng số {filteredViolations.length} biên bản
                      </span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="acc-btn-secondary btn-sm" 
                          onClick={() => setViolationsPage(prev => Math.max(prev - 1, 1))} 
                          disabled={violationsPage === 1}
                        >
                          {t('violationspenalties.before')}</button>
                        {Array.from({ length: Math.ceil(filteredViolations.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                          <button 
                            key={page} 
                            className={`btn btn-sm ${violationsPage === page ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setViolationsPage(page)}
                          >
                            {page}
                          </button>
                        ))}
                        <button 
                          className="acc-btn-secondary btn-sm" 
                          onClick={() => setViolationsPage(prev => Math.min(prev + 1, Math.ceil(filteredViolations.length / itemsPerPage)))} 
                          disabled={violationsPage === Math.ceil(filteredViolations.length / itemsPerPage)}
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="acc-card" style={{ padding: "20px" }}>
                  <div className="empty-state">
                    <div className="empty-state-icon"><ShieldOff size={24} /></div>
                    <p className="empty-state-title">{t('violationspenalties.no_violation_records_found')}</p>
                    <p className="empty-state-desc">{t('violationspenalties.there_are_no_violation')}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VIOLATION TYPES */}
          {activeTab === 'types' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="acc-table">
                <thead>
                  <tr>
                    <th>{t('violationspenalties.violation_type_name')}</th>
                    <th>{t('violationspenalties.describe')}</th>
                    <th className="text-right">{t('violationspenalties.default_fine')}</th>
                    <th>{t('violationspenalties.status')}</th>
                    <th className="text-right">{t('violationspenalties.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {violationTypes.length > 0 ? violationTypes.slice((typesPage - 1) * itemsPerPage, typesPage * itemsPerPage).map(typeItem => (
                    <tr key={typeItem.violationTypeId}>
                      <td><strong>{typeItem.name}</strong></td>
                      <td><span style={{ color: 'var(--text-muted)' }}>{typeItem.description}</span></td>
                      <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{(typeItem.defaultFine || 0).toLocaleString('vi-VN')} ₫</strong></td>
                      <td>
                        <span className={typeItem.isActive ? 'badge badge-success' : 'badge badge-neutral'}>
                          {typeItem.isActive ? t('violationspenalties.applying') : t('violationspenalties.stop_applying')}
                        </span>
                      </td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="acc-btn-ghost btn-sm btn-icon" title={t('violationspenalties.edit')} onClick={() => { setSelectedItem(typeItem); setTypeForm({ name: typeItem.name, description: typeItem.description, defaultFine: typeItem.defaultFine, isActive: typeItem.isActive }); setActiveModal('type'); }}>
                            <Edit3 size={14} />
                          </button>
                          <button className="acc-btn-ghost btn-sm btn-icon" title={t('violationspenalties.erase')} style={{ color: 'var(--danger)' }} onClick={() => { setSelectedItem(typeItem); setActiveModal('confirm_delete'); }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5}><div className="empty-state"><p className="empty-state-title">{t('violationspenalties.there_have_been_no')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {violationTypes.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((typesPage - 1) * itemsPerPage) + 1} - {Math.min(typesPage * itemsPerPage, violationTypes.length)} trong tổng số {violationTypes.length} loại vi phạm
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setTypesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={typesPage === 1}
                    >
                      {t('violationspenalties.before')}</button>
                    {Array.from({ length: Math.ceil(violationTypes.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${typesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setTypesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="acc-btn-secondary btn-sm" 
                      onClick={() => setTypesPage(prev => Math.min(prev + 1, Math.ceil(violationTypes.length / itemsPerPage)))} 
                      disabled={typesPage === Math.ceil(violationTypes.length / itemsPerPage)}
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

      {/* Modal: Violation Details */}
      {activeModal === 'details' && selectedItem && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">Chi tiết Biên bản — VIO-{selectedItem.violationId}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              {selectedItem.imageUrl && (
                <img src={selectedItem.imageUrl} alt={t('violationspenalties.photo_proof')} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13.5, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.booth')}</span><strong>{selectedItem.stallCode}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.date_of_establishment')}</span>{selectedItem.createdAt ? formatDate(selectedItem.createdAt) : (selectedItem.date || '—')}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.violation_type')}</span><strong>{selectedItem.violationTypeName || selectedItem.violationType?.name || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.founder')}</span><strong>{selectedItem.createdByName || '—'}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.announcement_date')}</span>{formatDate(selectedItem.notifiedAt)}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.update_date')}</span>{formatDate(selectedItem.updatedAt)}</div>
                <div style={{ gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>{t('violationspenalties.status')}</span><span className={getStatusBadge(selectedItem.status).cls}>{getStatusBadge(selectedItem.status).label}</span></div>
              </div>
              <div>
                <label className="acc-form-label">{t('violationspenalties.violations')}</label>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-title)' }}>{selectedItem.title}</p>
              </div>
              <div>
                <label className="acc-form-label">{t('violationspenalties.detailed_description')}</label>
                <p style={{ fontSize: 13.5, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selectedItem.description}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{t('violationspenalties.fine')}</span>
                <strong style={{ color: 'var(--danger)', fontSize: 18 }}>{(selectedItem.fineAmount || selectedItem.penalty || 0).toLocaleString('vi-VN')} ₫</strong>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('violationspenalties.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Type */}
      {activeModal === 'type' && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="acc-modal-container" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{selectedItem ? t('violationspenalties.edit') : t('violationspenalties.more')} Loại Vi Phạm</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleTypeSubmit}>
              <div className="acc-modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                    <AlertTriangle size={16} className="alert-icon" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div>
                  <label className="acc-form-label">{t('violationspenalties.violation_type_name')}</label>
                  <input type="text" className="acc-input" required maxLength={100} value={typeForm.name}
                    placeholder={t('violationspenalties.for_example_encroaching_the')} onChange={e => setTypeForm({ ...typeForm, name: e.target.value })} />
                </div>
                <div>
                  <label className="acc-form-label">{t('violationspenalties.default_fine_vnd')}</label>
                  <input type="number" className="acc-input" required min={0} value={typeForm.defaultFine}
                    onChange={e => setTypeForm({ ...typeForm, defaultFine: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="acc-form-label">{t('violationspenalties.describe_the_meaning')}</label>
                  <textarea className="form-textarea" rows={3} maxLength={500} value={typeForm.description}
                    onChange={e => setTypeForm({ ...typeForm, description: e.target.value })} />
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('violationspenalties.cancel')}</button>
                <button type="submit" className="acc-btn-primary">{t('violationspenalties.save_changes')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Delete */}
      {activeModal === 'confirm_delete' && selectedItem && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('violationspenalties.confirm_deletion')}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div className="alert alert-danger">
                <AlertTriangle size={16} className="alert-icon" />
                <span>{t('violationspenalties.you_are_about_to')}<strong>"{selectedItem.name}"</strong>{t('violationspenalties.this_action_cannot_be')}</span>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('violationspenalties.cancel')}</button>
              <button className="acc-btn-danger" onClick={deleteViolationType}>{t('violationspenalties.confirm_deletion')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Confirm Invoice */}
      {invoiceConfirmVio && (
        <div className="acc-modal-overlay" onClick={() => setInvoiceConfirmVio(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('violationspenalties.confirm_invoicing')}</span>
              <button className="acc-modal-close" onClick={() => setInvoiceConfirmVio(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              <div className="alert alert-warning">
                <AlertTriangle size={16} className="alert-icon" />
                <span>{t('violationspenalties.are_you_sure_you')}<strong>{(invoiceConfirmVio.fineAmount || invoiceConfirmVio.penalty || 0).toLocaleString('vi-VN')} ₫</strong> {t('violationspenalties.for_minutes')}<strong>VIO-{invoiceConfirmVio.violationId}</strong>?<br/><br/>{t('violationspenalties.this_action_cannot_be')}</span>
              </div>
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setInvoiceConfirmVio(null)}>{t('violationspenalties.cancel')}</button>
              <button className="acc-btn-primary" onClick={confirmCreateInvoice}>{t('violationspenalties.invoicing')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
