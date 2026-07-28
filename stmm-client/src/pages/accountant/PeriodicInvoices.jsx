import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  Search, Plus, Send, Eye, CheckCircle, AlertCircle, XCircle,
  AlertTriangle, RefreshCw, Settings, X, FileText
} from 'lucide-react';

const getStatusBadge = (status) => {
  const map = {
    'Paid': { cls: 'badge badge-success', label: 'Đã thu' },
    'Unpaid': { cls: 'badge badge-warning', label: 'Chờ thu' },
    'Draft': { cls: 'badge badge-info', label: 'Nháp' },
    'Overdue': { cls: 'badge badge-danger', label: 'Quá hạn' },
  };
  return map[status] || { cls: 'badge badge-neutral', label: status };
};

export default function PeriodicInvoices() {
  const { t } = useTranslation();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);

  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [activeModal, setActiveModal] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [availableStalls, setAvailableStalls] = useState([]);
  const [availableFeeTypes, setAvailableFeeTypes] = useState([]);

  const [adjustForm, setAdjustForm] = useState({ meterType: 'Electricity', newValue: '' });
  const [cancelReason, setCancelReason] = useState('');
  const [adhocForm, setAdhocForm] = useState({
    stallId: 0, stallSearch: '', feeTypeId: '', amount: 1000000, description: '',
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    month: new Date().getMonth() + 1, year: new Date().getFullYear()
  });

  const [modalError, setModalError] = useState(null);

  useEffect(() => {
    setModalError(null);
    if (activeModal === 'adhoc') {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` };
      if (availableStalls.length === 0) {
        fetch('http://localhost:5056/api/stalls', { headers }).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setAvailableStalls(data);
        }).catch(() => {});
      }
      if (availableFeeTypes.length === 0) {
        fetch('http://localhost:5056/api/accountant/config/fee-types', { headers }).then(r => r.json()).then(data => {
            if (Array.isArray(data)) setAvailableFeeTypes(data);
        }).catch(() => {});
      }
    }
  }, [activeModal]);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchInvoices = () => {
    setLoading(true);
    const session = localStorage.getItem('user');
    let userIdStr = '';
    if (session) {
      try {
        const u = JSON.parse(session);
        if (u && u.userId) userIdStr = u.userId;
      } catch (e) {}
    }
    const q = new URLSearchParams({ month: month || '', year: year || '', status: status !== 'all' ? status : '', search: search || '', userId: userIdStr }).toString();
    fetch(`http://localhost:5056/api/accountant/billing/invoices?${q}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(res => { if (!res.ok) throw new Error(); return res.json(); })
      .then(data => { setInvoices(data); setIsMock(false); setLoading(false); })
      .catch(() => {
        setTimeout(() => { setInvoices(getMockInvoices()); setIsMock(true); setLoading(false); }, 600);
      });
  };

  useEffect(() => { fetchInvoices(); }, [month, year, status]);
  useEffect(() => { setCurrentPage(1); }, [month, year, status, search]);

  const getMockInvoices = () => [
    { invoiceId: 101, stallCode: 'Kiosk A-12', vendorName: t('periodicinvoices.nguyen_van_a'), totalAmount: 12500000, month: 6, year: 2026, dueDate: '2026-06-20', status: 'Unpaid', details: [{ feeTypeName: t('periodicinvoices.rent_premises'), description: t('periodicinvoices.rent_for_kiosk_a12'), quantity: 1, unitPrice: 12000000, amount: 12000000 }, { feeTypeName: t('periodicinvoices.service_fee'), description: t('periodicinvoices.general_operating_management_fee'), quantity: 1, unitPrice: 500000, amount: 500000 }] },
    { invoiceId: 102, stallCode: 'Kiosk B-05', vendorName: t('periodicinvoices.tran_thi_b'), totalAmount: 3240000, month: 6, year: 2026, dueDate: '2026-06-20', status: 'Draft', details: [{ feeTypeName: t('periodicinvoices.electricity_bill'), description: t('periodicinvoices.electricity_consumption_in_june'), quantity: 600, unitPrice: 3500, amount: 2100000 }, { feeTypeName: t('periodicinvoices.water_fee'), description: t('periodicinvoices.water_consumption_in_june'), quantity: 60, unitPrice: 18000, amount: 1080000 }] },
    { invoiceId: 103, stallCode: 'Kiosk C-02', vendorName: t('periodicinvoices.pham_van_c'), totalAmount: 850000, month: 5, year: 2026, dueDate: '2026-06-05', status: 'Paid', details: [{ feeTypeName: t('periodicinvoices.repair'), description: t('periodicinvoices.cost_of_repairing_leaky'), quantity: 1, unitPrice: 850000, amount: 850000 }] },
    { invoiceId: 104, stallCode: 'Kiosk A-10', vendorName: t('periodicinvoices.le_hoang_d'), totalAmount: 14500000, month: 5, year: 2026, dueDate: '2026-05-30', status: 'Overdue', details: [{ feeTypeName: t('periodicinvoices.rent_premises'), description: t('periodicinvoices.rent_for_kiosk_a10'), quantity: 1, unitPrice: 12500000, amount: 12500000 }, { feeTypeName: t('periodicinvoices.fine'), description: t('periodicinvoices.penalty_for_encroaching_on'), quantity: 1, unitPrice: 2000000, amount: 2000000 }] },
    { invoiceId: 105, stallCode: 'Kiosk E-01', vendorName: t('periodicinvoices.hoang_thi_e'), totalAmount: 15000000, month: 6, year: 2026, dueDate: '2026-06-20', status: 'Draft', details: [{ feeTypeName: t('periodicinvoices.rent_premises'), description: t('periodicinvoices.rent_for_kiosk_area'), quantity: 1, unitPrice: 15000000, amount: 15000000 }] },
  ];

  const handleSelectRow = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(invoices.filter(i => i.status === 'Draft').map(i => i.invoiceId));
    else setSelectedIds([]);
  };
  const getSelectedTotal = () => invoices.filter(i => selectedIds.includes(i.invoiceId)).reduce((s, i) => s + i.totalAmount, 0);

  const openDetails = (invoice) => {
    if (isMock) { setSelectedInvoice(invoice); setActiveModal('details'); }
    else fetch(`http://localhost:5056/api/accountant/billing/invoices/${invoice.invoiceId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
      .then(r => r.json()).then(d => { setSelectedInvoice(d); setActiveModal('details'); })
      .catch(() => { setSelectedInvoice(invoice); setActiveModal('details'); });
  };

  const openAdjustModal = (inv) => {
    setSelectedInvoice(inv);
    setAdjustForm({ meterType: 'Electricity', newValue: '' });
    setModalError(null);
    setActiveModal('adjust');
  };

  const openCancelModal = (inv) => {
    setSelectedInvoice(inv);
    setCancelReason('');
    setModalError(null);
    setActiveModal('cancel');
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    if (isMock) {
      const updated = invoices.map(inv => {
        if (inv.invoiceId !== selectedInvoice.invoiceId) return inv;
        const consumption = adjustForm.newValue - adjustForm.oldValue;
        const unitPrice = adjustForm.meterType === 'Electricity' ? 3500 : 18000;
        const newAmount = consumption * unitPrice;
        const feeTypeName = adjustForm.meterType === 'Electricity' ? t('periodicinvoices.electricity_bill') : t('periodicinvoices.water_fee');
        let details = [...(inv.details || [])];
        const idx = details.findIndex(d => d.feeTypeName.includes(feeTypeName));
        const nd = { feeTypeName, description: t('periodicinvoices.consume_adjustformoldvalue_adjustformnewvalue'), quantity: consumption, unitPrice, amount: newAmount };
        if (idx >= 0) details[idx] = nd; else details.push(nd);
        return { ...inv, details, totalAmount: details.reduce((s, d) => s + d.amount, 0) };
      });
      setInvoices(updated);
      showNotification('success', t('periodicinvoices.updated_indexes_and_recalculated'));
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/billing/meter-readings/adjust?userId=1`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ stallId: adjustForm.stallId, meterType: adjustForm.meterType, month: selectedInvoice.month, year: selectedInvoice.year, oldValue: adjustForm.oldValue, newValue: adjustForm.newValue })
      }).then(async r => { 
        if (!r.ok) {
          const errData = await r.json().catch(() => ({}));
          throw new Error(errData.detail || errData.title || t('periodicinvoices.there_was_an_error'));
        }
        showNotification('success', t('periodicinvoices.updated_successfully')); 
        setActiveModal(null); 
        fetchInvoices(); 
      })
      .catch(e => setModalError(e.message));
    }
  };

  const handleAdhocSubmit = (e) => {
    e.preventDefault();
    if (!adhocForm.stallId) {
      setModalError(t('periodicinvoices.please_select_a_valid'));
      return;
    }
    if (isMock) {
      setInvoices([{ invoiceId: Math.floor(Math.random() * 900) + 200, stallCode: `Stall-${adhocForm.stallId}`, vendorName: t('periodicinvoices.small_business'), totalAmount: adhocForm.amount, month: adhocForm.month, year: adhocForm.year, dueDate: adhocForm.dueDate, status: 'Unpaid', details: [{ feeTypeName: t('periodicinvoices.fees_incurred'), description: adhocForm.description, quantity: 1, unitPrice: adhocForm.amount, amount: adhocForm.amount }] }, ...invoices]);
      showNotification('success', t('periodicinvoices.successfully_created_unexpected_invoices'));
      setActiveModal(null);
    } else {
      fetch('http://localhost:5056/api/accountant/billing/invoices/ad-hoc', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify(adhocForm) })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('periodicinvoices.error_when_creating_invoice'));
          }
          showNotification('success', t('periodicinvoices.successfully_issued_unexpected_invoices')); 
          setActiveModal(null); 
          fetchInvoices(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  const handleBulkApprove = () => {
    if (isMock) {
      setInvoices(invoices.map(inv => selectedIds.includes(inv.invoiceId) ? { ...inv, status: 'Unpaid' } : inv));
      setSelectedIds([]); setActiveModal(null);
      showNotification('success', t('periodicinvoices.selectedidslength_invoice_issued_successfully'));
    } else {
      fetch('http://localhost:5056/api/accountant/billing/invoices/bulk-approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ invoiceIds: selectedIds }) })
        .then(async r => { 
          if (!r.ok) {
            const errData = await r.json().catch(() => ({}));
            throw new Error(errData.detail || errData.title || t('periodicinvoices.error_when_mass_approving'));
          }
          showNotification('success', t('periodicinvoices.approval_of_selectedidslength_invoice')); 
          setSelectedIds([]); 
          setActiveModal(null); 
          fetchInvoices(); 
        })
        .catch(e => setModalError(e.message));
    }
  };

  const handleCancelInvoice = (e) => {
    e.preventDefault();
    if (isMock) {
      setInvoices(invoices.map(i => i.invoiceId === selectedInvoice.invoiceId ? { ...i, status: 'Canceled' } : i));
      showNotification('success', t('periodicinvoices.invoice_canceled_successfully_mock'));
      setActiveModal(null);
    } else {
      fetch(`http://localhost:5056/api/accountant/billing/invoices/${selectedInvoice.invoiceId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` },
        body: JSON.stringify({ reason: cancelReason })
      })
      .then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok || !d.success) throw new Error(d.message || d.title || t('periodicinvoices.error_canceling_invoice'));
        showNotification('success', d.message || t('periodicinvoices.invoice_canceled_successfully'));
        setActiveModal(null);
        fetchInvoices();
      })
      .catch(err => setModalError(err.message));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('periodicinvoices.ha_n_nh_k')}</h1>
          <p className="page-subtitle">{t('periodicinvoices.manage_close_issuance_books')}</p>
        </div>
        <div className="page-actions">
          {selectedIds.length > 0 && (
            <button className="btn btn-success" onClick={() => setActiveModal('bulk')}>
              <CheckCircle size={15} />
              <span>Phát Hành Hàng Loạt ({selectedIds.length})</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={() => setActiveModal('adhoc')}>
            <Plus size={15} />
            <span>{t('periodicinvoices.unexpected_bills')}</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <AlertCircle size={16} className="alert-icon" />
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button className="btn-ghost btn btn-icon btn-sm" onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}

      {/* Mock Warning */}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <span><strong>{t('periodicinvoices.simulation_mode')}</strong> {t('periodicinvoices.unable_to_connect_backend')}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="card-padded" style={{ padding: '16px 20px' }}>
        <form onSubmit={(e) => { e.preventDefault(); fetchInvoices(); }}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={14} className="search-icon-inner" />
            <input type="text" className="search-input" style={{ width: '100%' }}
              placeholder={t('periodicinvoices.find_kiosk_tenant_name')}
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="filter-select" value={month} onChange={e => setMonth(parseInt(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>)}
          </select>
          <select className="filter-select" value={year} onChange={e => setYear(parseInt(e.target.value))}>
            {[2025, 2026, 2027].map(yr => <option key={yr} value={yr}>Năm {yr}</option>)}
          </select>
          <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">{t('periodicinvoices.every_state')}</option>
            <option value="Draft">{t('periodicinvoices.draft')}</option>
            <option value="Unpaid">{t('periodicinvoices.waiting_for_collection_unpaid')}</option>
            <option value="Paid">{t('periodicinvoices.paid')}</option>
            <option value="Overdue">{t('periodicinvoices.qu_hn_overdue')}</option>
          </select>
          <button type="submit" className="btn btn-primary btn-sm">{t('periodicinvoices.filter')}</button>
        </form>
      </div>

      {/* Table */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">{t('periodicinvoices.loading_invoice_list')}</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 40, padding: '11px 16px' }}>
                  <input type="checkbox" onChange={handleSelectAll}
                    checked={invoices.length > 0 && invoices.filter(i => i.status === 'Draft').every(i => selectedIds.includes(i.invoiceId))} />
                </th>
                <th>{t('periodicinvoices.hd_code')}</th>
                <th>Kiosk</th>
                <th>{t('periodicinvoices.tenants')}</th>
                <th>{t('periodicinvoices.ky')}</th>
                <th className="text-right">{t('periodicinvoices.total_money')}</th>
                <th>{t('periodicinvoices.payment_term')}</th>
                <th>{t('periodicinvoices.status')}</th>
                <th className="text-right">{t('periodicinvoices.operation')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length > 0 ? invoices.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(inv => {
                const { cls, label } = getStatusBadge(inv.status);
                return (
                  <tr key={inv.invoiceId}>
                    <td style={{ padding: '13px 16px' }}>
                      {inv.status === 'Draft' ? (
                        <input type="checkbox" checked={selectedIds.includes(inv.invoiceId)} onChange={() => handleSelectRow(inv.invoiceId)} />
                      ) : <input type="checkbox" disabled style={{ opacity: 0.3 }} />}
                    </td>
                    <td><span style={{ fontWeight: 600, color: 'var(--text-title)', fontFamily: 'monospace', fontSize: 13 }}>INV-{inv.invoiceId}</span></td>
                    <td><span style={{ fontWeight: 700 }}>{inv.stallCode}</span></td>
                    <td>{inv.vendorName}</td>
                    <td><span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Th.{inv.month}/{inv.year}</span></td>
                    <td className="text-right"><span style={{ fontWeight: 700, color: 'var(--text-title)' }}>{inv.totalAmount.toLocaleString('vi-VN')} ₫</span></td>
                    <td><span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{inv.dueDate || '—'}</span></td>
                    <td><span className={cls}>{label}</span></td>
                    <td className="text-right">
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openDetails(inv)}>
                          <Eye size={13} /> {t('periodicinvoices.detail')}</button>
                        {(inv.status === 'Draft' || inv.status === 'Unpaid') && (
                          <>
                            <button className="btn btn-sm" style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)' }} onClick={() => openAdjustModal(inv)}>
                              {t('periodicinvoices.record_data')}</button>
                            <button className="btn btn-sm" style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => openCancelModal(inv)}>
                              {t('periodicinvoices.cancel')}</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-state-icon"><FileText size={24} /></div>
                      <p className="empty-state-title">{t('periodicinvoices.invoice_not_found')}</p>
                      <p className="empty-state-desc">{t('periodicinvoices.there_are_no_invoices')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {invoices.length > itemsPerPage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, invoices.length)} trong tổng số {invoices.length} hóa đơn
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1}
                >
                  {t('periodicinvoices.before')}</button>
                {Array.from({ length: Math.ceil(invoices.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button 
                    key={page} 
                    className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(invoices.length / itemsPerPage)))} 
                  disabled={currentPage === Math.ceil(invoices.length / itemsPerPage)}
                >
                  Sau
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Invoice Details */}
      {activeModal === 'details' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi Tiết Hóa Đơn — INV-{selectedInvoice.invoiceId}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '14px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', fontSize: 13.5 }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Kiosk: </span><strong>{selectedInvoice.stallCode}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('periodicinvoices.small_business')}</span><strong>{selectedInvoice.vendorName}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('periodicinvoices.submission_deadline')}</span>{selectedInvoice.dueDate || t('periodicinvoices.not_regulated')}</div>
                <div><span style={{ color: 'var(--text-muted)' }}>{t('periodicinvoices.status')}</span><span className={getStatusBadge(selectedInvoice.status).cls}>{getStatusBadge(selectedInvoice.status).label}</span></div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('periodicinvoices.fees')}</th>
                    <th>{t('periodicinvoices.description_index')}</th>
                    <th className="text-right">{t('periodicinvoices.quantity')}</th>
                    <th className="text-right">{t('periodicinvoices.unit_price')}</th>
                    <th className="text-right">{t('periodicinvoices.make_money')}</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.details?.map((d, i) => (
                    <tr key={i}>
                      <td><strong>{d.feeTypeName}</strong></td>
                      <td style={{ color: 'var(--text-muted)' }}>{d.description}</td>
                      <td className="text-right">{d.quantity.toLocaleString()}</td>
                      <td className="text-right">{d.unitPrice.toLocaleString('vi-VN')} ₫</td>
                      <td className="text-right"><strong>{d.amount.toLocaleString('vi-VN')} ₫</strong></td>
                    </tr>
                  ))}
                  <tr style={{ background: 'var(--primary-light)', fontWeight: 800 }}>
                    <td colSpan={4} className="text-right" style={{ color: 'var(--text-title)' }}>{t('periodicinvoices.total')}</td>
                    <td className="text-right" style={{ color: 'var(--primary)', fontSize: 15 }}>{selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('periodicinvoices.close')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cancel Invoice */}
      {activeModal === 'cancel' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Hủy Hóa Đơn — INV-{selectedInvoice.invoiceId}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleCancelInvoice}>
              <div className="modal-body">
                {modalError && (
                  <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                    <AlertTriangle size={16} className="alert-icon" />
                    <span>{modalError}</span>
                  </div>
                )}
                <div className="alert alert-warning" style={{ marginBottom: 14 }}>
                  <AlertTriangle size={15} className="alert-icon" />
                  <span>{t('periodicinvoices.this_action_will_cancel')}</span>
                </div>
                <div>
                  <label className="form-label">{t('periodicinvoices.reason_for_cancellation_will')}</label>
                  <textarea 
                    className="form-input" 
                    rows={3} 
                    style={{ width: '100%', resize: 'vertical' }}
                    placeholder={t('periodicinvoices.for_example_wrong_electricity')}
                    value={cancelReason} 
                    onChange={e => setCancelReason(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('periodicinvoices.close')}</button>
                <button type="submit" className="btn" style={{ background: 'var(--danger)', color: '#fff', border: 'none' }}>{t('periodicinvoices.confirm_cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Meter Adjust */}
      {activeModal === 'adjust' && selectedInvoice && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Điều Chỉnh Chỉ Số — {selectedInvoice.stallCode}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdjustSubmit}>
              <div className="modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
                <div className="alert alert-info">
                  <AlertTriangle size={15} className="alert-icon" />
                  <span>Sửa sai chỉ số Điện/Nước. Hóa đơn tháng {selectedInvoice.month}/{selectedInvoice.year} sẽ tự động tính lại.</span>
                </div>
                <div>
                  <label className="form-label">{t('periodicinvoices.meter_type')}</label>
                  <select className="form-select" value={adjustForm.meterType} onChange={e => setAdjustForm({ ...adjustForm, meterType: e.target.value })}>
                    <option value="Electricity">{t('periodicinvoices.electricity_kwh')}</option>
                    <option value="Water">{t('periodicinvoices.water_m')}</option>
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">{t('periodicinvoices.old_index_beginning_of')}</label>
                    <input type="number" className="form-input" required min={0} value={adjustForm.oldValue}
                      onChange={e => setAdjustForm({ ...adjustForm, oldValue: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="form-label">{t('periodicinvoices.new_index')}</label>
                    <input type="number" className="form-input" required min={0} value={adjustForm.newValue}
                      onChange={e => setAdjustForm({ ...adjustForm, newValue: parseFloat(e.target.value) || 0 })} />
                  </div>
                </div>
                {adjustForm.newValue >= adjustForm.oldValue && (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', background: 'var(--bg-base)', padding: '10px 14px', borderRadius: 'var(--radius-md)' }}>
                    {t('periodicinvoices.consumption')}<strong style={{ color: 'var(--primary)' }}>{(adjustForm.newValue - adjustForm.oldValue).toLocaleString()}</strong> {adjustForm.meterType === 'Electricity' ? 'kWh' : 'm³'}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('periodicinvoices.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('periodicinvoices.update_recalculate')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ad-hoc Invoice */}
      {activeModal === 'adhoc' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('periodicinvoices.issuing_unscheduled_invoices')}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={handleAdhocSubmit}>
              <div className="modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">{t('periodicinvoices.store_codename')}</label>
                    <input type="text" list="stall-list" className="form-input" required placeholder={t('periodicinvoices.enter_to_search_for')}
                      value={adhocForm.stallSearch || ''}
                      onChange={e => {
                        const val = e.target.value;
                        const stall = availableStalls.find(s => `${s.code} ${s.tenantName ? `(${s.tenantName})` : ''}` === val);
                        setAdhocForm({ ...adhocForm, stallSearch: val, stallId: stall ? stall.stallId : 0 });
                      }}
                    />
                    <datalist id="stall-list">
                      {availableStalls.map(s => <option key={s.stallId} value={`${s.code} ${s.tenantName ? `(${s.tenantName})` : ''}`} />)}
                    </datalist>
                    {adhocForm.stallSearch && !adhocForm.stallId && <small style={{ color: 'var(--text-danger)', marginTop: '4px', display: 'block' }}>{t('periodicinvoices.please_select_a_valid')}</small>}
                  </div>
                  <div>
                    <label className="form-label">{t('periodicinvoices.type_of_fee_incurred')}</label>
                    <select className="form-select" required value={adhocForm.feeTypeId} onChange={e => setAdhocForm({ ...adhocForm, feeTypeId: parseInt(e.target.value) })}>
                      <option value="">{t('periodicinvoices.select_fee_type')}</option>
                      {availableFeeTypes.map(f => (
                        <option key={f.feeTypeId} value={f.feeTypeId}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="form-label">{t('periodicinvoices.amount_vnd')}</label>
                    <input type="number" className="form-input" required min={1} value={adhocForm.amount}
                      onChange={e => setAdhocForm({ ...adhocForm, amount: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <label className="form-label">{t('periodicinvoices.payment_deadline')}</label>
                    <input type="date" className="form-input" required value={adhocForm.dueDate}
                      onChange={e => setAdhocForm({ ...adhocForm, dueDate: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">{t('periodicinvoices.describe_the_reason_for')}</label>
                  <textarea className="form-textarea" required rows={3} maxLength={500}
                    placeholder={t('periodicinvoices.specific_description_of_the')}
                    value={adhocForm.description}
                    onChange={e => setAdhocForm({ ...adhocForm, description: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('periodicinvoices.cancel')}</button>
                <button type="submit" className="btn btn-primary">{t('periodicinvoices.release_immediately')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Approve */}
      {activeModal === 'bulk' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{t('periodicinvoices.mass_release_confirmed')}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {modalError && (
                <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', whiteSpace: 'pre-line' }}>
                  <AlertTriangle size={16} className="alert-icon" />
                  <span>{modalError}</span>
                </div>
              )}
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14.5, lineHeight: 1.6 }}>
                  {t('periodicinvoices.the_system_will_switch')}<strong>{selectedIds.length}</strong> {t('periodicinvoices.draft_invoice_to_status')}<strong>{t('periodicinvoices.wait_for_payment')}</strong>.
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--bg-base)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('periodicinvoices.total_amount_issued')}</span>
                <strong style={{ color: 'var(--primary)', fontSize: 16 }}>{getSelectedTotal().toLocaleString('vi-VN')} ₫</strong>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {t('periodicinvoices.once_published_notifications_will')}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('periodicinvoices.cancel')}</button>
              <button className="btn btn-success" onClick={handleBulkApprove}>{t('periodicinvoices.confirmation_release')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
