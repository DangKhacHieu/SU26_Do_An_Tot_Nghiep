import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Search, DollarSign, Clock,
  ThumbsUp, ThumbsDown, AlertTriangle, RefreshCw, Bell,
  AlertCircle, FileText, MessageSquare, Building, X, Info
} from 'lucide-react';

const formatCurrency = (v) => (v || 0).toLocaleString('vi-VN') + ' ₫';
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const getPaymentStatusBadge = (s) => {
  if (s === 'Approved') return { cls: 'badge badge-success', label: 'Đã duyệt' };
  if (s === 'Pending') return { cls: 'badge badge-warning', label: 'Chờ xác nhận' };
  if (s === 'Rejected') return { cls: 'badge badge-danger', label: 'Từ chối' };
  return { cls: 'badge badge-neutral', label: s };
};

const getDisputeStatusBadge = (s) => {
  if (s === 'Approved') return { cls: 'badge badge-success', label: 'Chấp thuận' };
  if (s === 'Rejected') return { cls: 'badge badge-danger', label: 'Từ chối' };
  return { cls: 'badge badge-warning', label: 'Đang xử lý' };
};

export default function PaymentVerification() {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState('verification');
  const [searchQuery, setSearchQuery] = useState('');
  const [payments, setPayments] = useState([]);
  const [debts, setDebts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [notification, setNotification] = useState(null);
  const [activeModal, setActiveModal] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedInvoiceDetail, setSelectedInvoiceDetail] = useState(null);
  const [loadingPopup, setLoadingPopup] = useState(false);
  const [rejectionNote, setRejectionNote] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [disputeApprove, setDisputeApprove] = useState(true);
  const [disputeFeedback, setDisputeFeedback] = useState('');
  
  const [isRefund, setIsRefund] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundMethod, setRefundMethod] = useState('Transfer');
  const [transactionCode, setTransactionCode] = useState('');
  
  const [paymentsPage, setPaymentsPage] = useState(1);
  const [debtsPage, setDebtsPage] = useState(1);
  const [disputesPage, setDisputesPage] = useState(1);
  const itemsPerPage = 5;

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4500);
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
    Promise.all([
      fetch(`http://localhost:5056/api/accountant/payments/pending?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`http://localhost:5056/api/accountant/payments/debts?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`http://localhost:5056/api/accountant/payments/disputes?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (!r.ok) throw new Error(); return r.json(); })
    ])
      .then(([pay, debt, disp]) => { setPayments(pay); setDebts(debt); setDisputes(disp); setLoading(false); })
      .catch(() => { setTimeout(() => { setPayments(getMockPayments()); setDebts(getMockDebts()); setDisputes(getMockDisputes()); setIsMock(true); setLoading(false); }, 500); });
  };

  useEffect(() => { loadAllData(); }, []);

  useEffect(() => {
    setPaymentsPage(1);
    setDebtsPage(1);
    setDisputesPage(1);
  }, [searchQuery, activeTab]);

  const getMockPayments = () => [
    { paymentId: 10, transactionCode: 'FT2605892309', method: t('paymentverification.bank_transfer'), amount: 3240000, paidAt: '2026-06-03T10:20:00Z', invoiceId: 5, stallCode: 'Kiosk B-05', tenantName: t('paymentverification.trn_th_b'), status: 'Pending' },
    { paymentId: 11, transactionCode: 'FT2605892288', method: t('paymentverification.bank_transfer'), amount: 15000000, paidAt: '2026-06-02T15:45:00Z', invoiceId: 6, stallCode: 'Kiosk E-01', tenantName: t('paymentverification.hoang_thi_e'), status: 'Pending' },
    { paymentId: 12, transactionCode: 'CASH-9092', method: t('paymentverification.cash'), amount: 2000000, paidAt: '2026-06-01T14:15:00Z', invoiceId: 7, stallCode: 'Kiosk A-10', tenantName: t('paymentverification.le_hoang_d'), status: 'Pending' },
    { paymentId: 8, transactionCode: 'FT2605891102', method: t('paymentverification.bank_transfer'), amount: 12500000, paidAt: '2026-05-30T09:30:00Z', invoiceId: 3, stallCode: 'Kiosk A-12', tenantName: t('paymentverification.nguyen_van_a'), status: 'Approved' }
  ];
  const getMockDebts = () => [
    { stallId: 1, stallCode: 'Kiosk B-12', tenantName: t('paymentverification.nguyen_van_hung'), rentDebt: 4500000, utilityDebt: 1250000, violationDebt: 1500000, totalDebt: 7250000, lastDueDate: '2026-05-25' },
    { stallId: 2, stallCode: 'Kiosk A-03', tenantName: t('paymentverification.tran_thi_my'), rentDebt: 0, utilityDebt: 480000, violationDebt: 500000, totalDebt: 980000, lastDueDate: '2026-05-25' },
    { stallId: 3, stallCode: 'Kiosk C-10', tenantName: t('paymentverification.pham_thanh_son'), rentDebt: 8000000, utilityDebt: 2300000, violationDebt: 5000000, totalDebt: 15300000, lastDueDate: '2026-05-25' }
  ];
  const getMockDisputes = () => [
    { requestId: 51, invoiceId: 5, title: t('paymentverification.sai_lch_s_nc'), description: t('paymentverification.the_water_index_at'), status: 'Pending', createdAt: '2026-06-02T08:15:00Z', stallCode: 'Kiosk B-05', tenantName: t('paymentverification.tran_thi_b'), invoiceMonth: 5, invoiceYear: 2026, invoiceTotalAmount: 3240000, vendorBankName: 'Vietcombank', vendorBankAccount: '0123456789', invoiceStatus: 'Unpaid' },
    { requestId: 48, invoiceId: 3, title: t('paymentverification.overcharging_for_cleaning_services'), description: t('paymentverification.the_family_has_registered'), status: 'Approved', createdAt: '2026-05-28T14:40:00Z', stallCode: 'Kiosk A-12', tenantName: t('paymentverification.nguyen_van_a'), invoiceMonth: 5, invoiceYear: 2026, invoiceTotalAmount: 12500000, vendorBankName: 'Techcombank', vendorBankAccount: '190333444555', invoiceStatus: 'Paid' }
  ];
  const getMockInvoiceDetail = (invoiceId) => ({
    invoiceId, month: 5, year: 2026, totalAmount: 3240000, status: 'Unpaid',
    stallCode: 'Kiosk B-05', vendorName: t('paymentverification.tran_thi_b'),
    details: [
      { invoiceDetailId: 1, feeTypeName: t('paymentverification.premises_rent'), description: t('paymentverification.kiosk_rental_in_may'), quantity: 1, unitPrice: 3000000, amount: 3000000 },
      { invoiceDetailId: 2, feeTypeName: t('paymentverification.electricity_bills_for_daily'), description: t('paymentverification.electricity_consumption_80_kwh'), quantity: 80, unitPrice: 3000, amount: 240000 }
    ]
  });
  const getMockStallDebtDetail = (stallId) => ({
    stallId, stallCode: stallId === 1 ? 'Kiosk B-12' : stallId === 2 ? 'Kiosk A-03' : 'Kiosk C-10',
    tenantName: stallId === 1 ? t('paymentverification.nguyen_van_hung') : stallId === 2 ? t('paymentverification.tran_thi_my') : t('paymentverification.pham_thanh_son'),
    unpaidInvoices: [{ invoiceId: 101, month: 5, year: 2026, totalAmount: stallId === 1 ? 5750000 : stallId === 2 ? 480000 : 10300000, status: 'Unpaid', dueDate: '2026-05-25' }],
    unpaidViolations: [{ violationId: 81, title: t('paymentverification.encroaching_the_hallway'), fineAmount: stallId === 1 ? 1500000 : stallId === 2 ? 500000 : 5000000 }]
  });

  const handleApprovePayment = (pay) => {
    if (!window.confirm(t('paymentverification.confirm_transaction_approval_paytransactioncode'))) return;
    if (isMock) { setPayments(p => p.map(x => x.paymentId === pay.paymentId ? { ...x, status: 'Approved' } : x)); showNotification('success', t('paymentverification.successful_transaction_confirmed')); }
    else fetch(`http://localhost:5056/api/accountant/payments/${pay.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: true }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.successful_payment_confirmation')); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.unable_to_approve_payment')));
  };

  const submitRejectPayment = (e) => {
    e.preventDefault();
    if (isMock) { setPayments(p => p.filter(x => x.paymentId !== selectedItem.paymentId)); showNotification('success', t('paymentverification.selecteditemtransactioncode_transaction_declined')); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/${selectedItem.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: false, rejectionNote }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.payment_refused')); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.payment_cannot_be_refused')));
  };

  const handleViewOriginalInvoice = (invoiceId, stallCode) => {
    setLoadingPopup(true); setSelectedItem({ invoiceId, stallCode }); setActiveModal('invoice_detail');
    if (isMock) { setSelectedInvoiceDetail(getMockInvoiceDetail(invoiceId)); setLoadingPopup(false); }
    else fetch(`http://localhost:5056/api/accountant/billing/invoices/${invoiceId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).then(d => { setSelectedInvoiceDetail(d); setLoadingPopup(false); }).catch(() => { setSelectedInvoiceDetail(getMockInvoiceDetail(invoiceId)); setLoadingPopup(false); });
  };

  const handleViewDebtDetail = (debt) => {
    setLoadingPopup(true); setSelectedItem(debt); setActiveModal('debt_detail');
    if (isMock) { setSelectedInvoiceDetail(getMockStallDebtDetail(debt.stallId)); setLoadingPopup(false); }
    else fetch(`http://localhost:5056/api/accountant/payments/debts/${debt.stallId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => r.json()).then(d => { setSelectedInvoiceDetail(d); setLoadingPopup(false); }).catch(() => { setSelectedInvoiceDetail(getMockStallDebtDetail(debt.stallId)); setLoadingPopup(false); });
  };

  const handleSendReminderClick = (debt) => {
    setSelectedItem(debt);
    setReminderMessage(t('paymentverification.management_announced_store_debtstallcode'));
    setActiveModal('send_reminder');
  };

  const submitSendReminder = (e) => {
    e.preventDefault();
    if (isMock) { showNotification('success', t('paymentverification.debt_reminder_sent_to')); setActiveModal(null); }
    else fetch('http://localhost:5056/api/accountant/payments/debts/notify?userId=1', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ stallId: selectedItem.stallId, customMessage: reminderMessage }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.debt_reminder_sent_successfully')); setActiveModal(null); })
      .catch(() => showNotification('danger', t('paymentverification.sending_debt_reminder_failed')));
  };

  const handleResolveDisputeClick = (dispute, approve) => {
    setSelectedItem(dispute); setDisputeApprove(approve);
    setDisputeFeedback(approve ? t('paymentverification.feedback_has_been_received') : t('paymentverification.refuse_to_resolve_the'));
    setIsRefund(false);
    setRefundAmount('');
    setRefundMethod('Transfer');
    setTransactionCode('');
    setActiveModal('resolve_dispute');
  };

  const submitResolveDispute = (e) => {
    e.preventDefault();
    if (isMock) { setDisputes(d => d.map(x => x.requestId === selectedItem.requestId ? { ...x, status: disputeApprove ? 'Approved' : 'Rejected' } : x)); showNotification('success', `Đã ${disputeApprove ? t('paymentverification.accept') : t('paymentverification.refuse')} kháng nghị!`); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/disputes/${selectedItem.requestId}/resolve?userId=1`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, 
      body: JSON.stringify({ 
        approve: disputeApprove, 
        feedback: disputeFeedback,
        isRefund,
        refundAmount: isRefund ? (parseInt(refundAmount) || 0) : 0,
        refundMethod: isRefund ? refundMethod : null,
        transactionCode: isRefund ? transactionCode : null
      }) 
    })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.appeal_responded_successfully')); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.appeal_processing_failed')));
  };

  const filteredPayments = payments.filter(p => [p.transactionCode, p.stallCode, p.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredDebts = debts.filter(d => [d.stallCode, d.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredDisputes = disputes.filter(d => [d.stallCode, d.tenantName, d.title].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('paymentverification.payment_verification_balance')}</h1>
          <p className="page-subtitle">{t('paymentverification.check_transactions_manage_outstanding')}</p>
        </div>
        <div className="page-actions"></div>
      </div>

      {/* Notification */}
      {notification && (
        <div className={`alert alert-${notification.type}`}>
          <AlertCircle size={16} className="alert-icon" />
          <span style={{ flex: 1 }}>{notification.message}</span>
          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <span><strong>{t('paymentverification.simulation_mode')}</strong> {t('paymentverification.showing_alternative_simulation_data')}</span>
        </div>
      )}

      {/* Search */}
      <div className="card-padded" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={14} className="search-icon-inner" />
            <input type="text" className="search-input" style={{ width: '100%' }}
              placeholder={t('paymentverification.find_gd_code_stall')}
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { id: 'verification', label: t('paymentverification.transaction_reconciliation'), icon: Clock },
          { id: 'debts', label: t('paymentverification.monitor_outstanding_balances'), icon: Building },
          { id: 'disputes', label: t('paymentverification.invoice_appeal'), icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}>
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner" />
          <p className="loading-text">{t('paymentverification.loading_payment_data')}</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PAYMENT VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('paymentverification.transaction_code')}</th>
                    <th>{t('paymentverification.stallssmall_traders')}</th>
                    <th>{t('paymentverification.method')}</th>
                    <th>{t('paymentverification.date_of_submission')}</th>
                    <th className="text-right">{t('paymentverification.amount')}</th>
                    <th>{t('paymentverification.status')}</th>
                    <th className="text-right">{t('paymentverification.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length > 0 ? filteredPayments.slice((paymentsPage - 1) * itemsPerPage, paymentsPage * itemsPerPage).map(pay => {
                    const { cls, label } = getPaymentStatusBadge(pay.status);
                    return (
                      <tr key={pay.paymentId}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600 }}>{pay.transactionCode}</span></td>
                        <td>
                          <div><strong>{pay.stallCode}</strong></div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pay.tenantName}</div>
                        </td>
                        <td><span className="badge badge-neutral">{pay.method}</span></td>
                        <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(pay.paidAt)}</span></td>
                        <td className="text-right"><strong style={{ color: 'var(--text-title)' }}>{formatCurrency(pay.amount)}</strong></td>
                        <td><span className={cls}>{label}</span></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => handleViewOriginalInvoice(pay.invoiceId, pay.stallCode)}>
                              <FileText size={13} /> {t('paymentverification.original_contract')}</button>
                            {pay.status === 'Pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprovePayment(pay)}>
                                  <ThumbsUp size={13} /> {t('paymentverification.browse')}</button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setSelectedItem(pay); setRejectionNote(''); setActiveModal('reject_payment'); }}>
                                  <ThumbsDown size={13} /> {t('paymentverification.refuse')}</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><CheckCircle size={24} /></div><p className="empty-state-title">{t('paymentverification.there_are_no_transactions')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredPayments.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((paymentsPage - 1) * itemsPerPage) + 1} - {Math.min(paymentsPage * itemsPerPage, filteredPayments.length)} trong tổng số {filteredPayments.length} giao dịch
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setPaymentsPage(prev => Math.max(prev - 1, 1))} 
                      disabled={paymentsPage === 1}
                    >
                      {t('paymentverification.before')}</button>
                    {Array.from({ length: Math.ceil(filteredPayments.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${paymentsPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setPaymentsPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setPaymentsPage(prev => Math.min(prev + 1, Math.ceil(filteredPayments.length / itemsPerPage)))} 
                      disabled={paymentsPage === Math.ceil(filteredPayments.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DEBTS */}
          {activeTab === 'debts' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('paymentverification.stallssmall_traders')}</th>
                    <th className="text-right">{t('paymentverification.rent_debt')}</th>
                    <th className="text-right">{t('paymentverification.electricitywater_debt')}</th>
                    <th className="text-right">{t('paymentverification.debt_violation')}</th>
                    <th className="text-right">{t('paymentverification.total_debt')}</th>
                    <th>{t('paymentverification.deadline')}</th>
                    <th className="text-right">{t('paymentverification.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDebts.length > 0 ? filteredDebts.slice((debtsPage - 1) * itemsPerPage, debtsPage * itemsPerPage).map(debt => (
                    <tr key={debt.stallId}>
                      <td>
                        <div><strong>{debt.stallCode}</strong></div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{debt.tenantName}</div>
                      </td>
                      <td className="text-right">{debt.rentDebt > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(debt.rentDebt)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td className="text-right">{debt.utilityDebt > 0 ? <span style={{ color: 'var(--warning)', fontWeight: 600 }}>{formatCurrency(debt.utilityDebt)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td className="text-right">{debt.violationDebt > 0 ? <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(debt.violationDebt)}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                      <td className="text-right"><strong style={{ color: 'var(--primary)', fontSize: 14 }}>{formatCurrency(debt.totalDebt)}</strong></td>
                      <td><span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{debt.lastDueDate}</span></td>
                      <td className="text-right">
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDebtDetail(debt)}><FileText size={13} /> {t('paymentverification.detail')}</button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSendReminderClick(debt)}><Bell size={13} /> {t('paymentverification.debt_reminder')}</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><DollarSign size={24} /></div><p className="empty-state-title">{t('paymentverification.there_is_no_outstanding')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredDebts.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((debtsPage - 1) * itemsPerPage) + 1} - {Math.min(debtsPage * itemsPerPage, filteredDebts.length)} trong tổng số {filteredDebts.length} sạp
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setDebtsPage(prev => Math.max(prev - 1, 1))} 
                      disabled={debtsPage === 1}
                    >
                      {t('paymentverification.before')}</button>
                    {Array.from({ length: Math.ceil(filteredDebts.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${debtsPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDebtsPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setDebtsPage(prev => Math.min(prev + 1, Math.ceil(filteredDebts.length / itemsPerPage)))} 
                      disabled={debtsPage === Math.ceil(filteredDebts.length / itemsPerPage)}
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('paymentverification.stallssmall_traders')}</th>
                    <th>{t('paymentverification.content_of_appeal')}</th>
                    <th>{t('paymentverification.monthly_contract')}</th>
                    <th className="text-right">{t('paymentverification.contract_value')}</th>
                    <th>{t('paymentverification.date_sent')}</th>
                    <th>{t('paymentverification.status')}</th>
                    <th className="text-right">{t('paymentverification.operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDisputes.length > 0 ? filteredDisputes.slice((disputesPage - 1) * itemsPerPage, disputesPage * itemsPerPage).map(dis => {
                    const { cls, label } = getDisputeStatusBadge(dis.status);
                    return (
                      <tr key={dis.requestId}>
                        <td>
                          <div><strong>{dis.stallCode}</strong></div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dis.tenantName}</div>
                        </td>
                        <td><span style={{ fontWeight: 600, fontSize: 13 }}>{dis.title}</span></td>
                        <td><span className="badge badge-neutral">Th.{dis.invoiceMonth}/{dis.invoiceYear}</span></td>
                        <td className="text-right"><strong>{formatCurrency(dis.invoiceTotalAmount)}</strong></td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(dis.createdAt)}</span></td>
                        <td><span className={cls}>{label}</span></td>
                        <td className="text-right">
                          {dis.status === 'Pending' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button className="btn btn-success btn-sm" onClick={() => handleResolveDisputeClick(dis, true)}><ThumbsUp size={13} /> {t('paymentverification.accept')}</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleResolveDisputeClick(dis, false)}><ThumbsDown size={13} /> {t('paymentverification.refuse')}</button>
                            </div>
                          )}
                          {dis.status !== 'Pending' && <span className="badge badge-neutral">{t('paymentverification.processed')}</span>}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><MessageSquare size={24} /></div><p className="empty-state-title">{t('paymentverification.there_were_no_appeals')}</p></div></td></tr>
                  )}
                </tbody>
              </table>
              {filteredDisputes.length > itemsPerPage && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    Hiển thị {((disputesPage - 1) * itemsPerPage) + 1} - {Math.min(disputesPage * itemsPerPage, filteredDisputes.length)} trong tổng số {filteredDisputes.length} kháng nghị
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setDisputesPage(prev => Math.max(prev - 1, 1))} 
                      disabled={disputesPage === 1}
                    >
                      {t('paymentverification.before')}</button>
                    {Array.from({ length: Math.ceil(filteredDisputes.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                      <button 
                        key={page} 
                        className={`btn btn-sm ${disputesPage === page ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setDisputesPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                    <button 
                      className="btn btn-secondary btn-sm" 
                      onClick={() => setDisputesPage(prev => Math.min(prev + 1, Math.ceil(filteredDisputes.length / itemsPerPage)))} 
                      disabled={disputesPage === Math.ceil(filteredDisputes.length / itemsPerPage)}
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

      {/* Modal: Reject Payment */}
      {activeModal === 'reject_payment' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Từ chối Giao dịch — {selectedItem.transactionCode}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitRejectPayment}>
              <div className="modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 13.5 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.stall')}</span><strong>{selectedItem.stallCode}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.small_business')}</span>{selectedItem.tenantName}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.amount')}</span><strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedItem.amount)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.method')}</span>{selectedItem.method}</div>
                </div>
                <div>
                  <label className="form-label">{t('paymentverification.reason_for_refusal')}<span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea className="form-textarea" rows={4} required
                    placeholder={t('paymentverification.specify_the_reason_wrong')}
                    value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className="btn btn-danger">{t('paymentverification.confirmed_refusal')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Detail */}
      {activeModal === 'invoice_detail' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi tiết Hóa đơn gốc — {selectedItem?.stallCode}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {loadingPopup ? (
                <div className="loading-container" style={{ padding: 40 }}>
                  <div className="loading-spinner" /><p className="loading-text">{t('paymentverification.loading')}</p>
                </div>
              ) : selectedInvoiceDetail && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 13.5 }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.stall')}</span><strong>{selectedInvoiceDetail.stallCode}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.month')}</span>Th.{selectedInvoiceDetail.month}/{selectedInvoiceDetail.year}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.small_business')}</span>{selectedInvoiceDetail.vendorName}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.status')}</span><span className="badge badge-warning">{selectedInvoiceDetail.status}</span></div>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>{t('paymentverification.fees')}</th><th>{t('paymentverification.describe')}</th><th className="text-right">{t('paymentverification.quantity')}</th><th className="text-right">{t('paymentverification.unit_price')}</th><th className="text-right">{t('paymentverification.make_money')}</th></tr></thead>
                    <tbody>
                      {selectedInvoiceDetail.details?.map((d, i) => (
                        <tr key={i}>
                          <td><strong>{d.feeTypeName}</strong></td>
                          <td style={{ color: 'var(--text-muted)' }}>{d.description}</td>
                          <td className="text-right">{d.quantity}</td>
                          <td className="text-right">{d.unitPrice.toLocaleString('vi-VN')} ₫</td>
                          <td className="text-right"><strong>{d.amount.toLocaleString('vi-VN')} ₫</strong></td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--primary-light)', fontWeight: 800 }}>
                        <td colSpan={4} className="text-right">{t('paymentverification.total')}</td>
                        <td className="text-right" style={{ color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(selectedInvoiceDetail.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.close')}</button></div>
          </div>
        </div>
      )}

      {/* Modal: Debt Detail */}
      {activeModal === 'debt_detail' && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Chi tiết Dư nợ — {selectedItem?.stallCode}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="modal-body">
              {loadingPopup ? (
                <div className="loading-container" style={{ padding: 40 }}><div className="loading-spinner" /></div>
              ) : selectedInvoiceDetail && (
                <>
                  <div style={{ fontSize: 13.5, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', marginBottom: 4 }}>
                    <strong>{selectedInvoiceDetail.stallCode}</strong> — {selectedInvoiceDetail.tenantName}
                  </div>
                  {selectedInvoiceDetail.unpaidInvoices?.length > 0 && (
                    <>
                      <label className="form-label" style={{ marginBottom: 8 }}>{t('paymentverification.unpaid_invoice')}</label>
                      <table className="data-table">
                        <thead><tr><th>{t('paymentverification.hd_code')}</th><th>{t('paymentverification.ky')}</th><th className="text-right">{t('paymentverification.amount')}</th><th>{t('paymentverification.term')}</th><th>{t('paymentverification.status')}</th></tr></thead>
                        <tbody>
                          {selectedInvoiceDetail.unpaidInvoices.map(inv => (
                            <tr key={inv.invoiceId}>
                              <td><span style={{ fontFamily: 'monospace', fontSize: 12.5 }}>INV-{inv.invoiceId}</span></td>
                              <td>Th.{inv.month}/{inv.year}</td>
                              <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(inv.totalAmount)}</strong></td>
                              <td>{inv.dueDate}</td>
                              <td><span className="badge badge-warning">{inv.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                  {selectedInvoiceDetail.unpaidViolations?.length > 0 && (
                    <>
                      <label className="form-label" style={{ marginTop: 16, marginBottom: 8 }}>{t('paymentverification.violations_have_not_yet')}</label>
                      <table className="data-table">
                        <thead><tr><th>{t('paymentverification.violations')}</th><th className="text-right">{t('paymentverification.fine')}</th></tr></thead>
                        <tbody>
                          {selectedInvoiceDetail.unpaidViolations.map(v => (
                            <tr key={v.violationId}>
                              <td>{v.title}</td>
                              <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(v.fineAmount)}</strong></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.close')}</button></div>
          </div>
        </div>
      )}

      {/* Modal: Send Reminder */}
      {activeModal === 'send_reminder' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Gửi Thông báo Nhắc nợ — {selectedItem.stallCode}</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitSendReminder}>
              <div className="modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                  <span style={{ fontSize: 13 }}>{t('paymentverification.total_current_debt')}</span>
                  <strong style={{ color: 'var(--danger)', fontSize: 16 }}>{formatCurrency(selectedItem.totalDebt)}</strong>
                </div>
                <div>
                  <label className="form-label">{t('paymentverification.notification_content')}</label>
                  <textarea className="form-textarea" rows={5} value={reminderMessage} onChange={e => setReminderMessage(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className="btn btn-primary"><Bell size={14} /> {t('paymentverification.send_notification')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {activeModal === 'resolve_dispute' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" style={{ maxWidth: 850, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{disputeApprove ? t('paymentverification.accept') : t('paymentverification.refuse')} Kháng nghị</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitResolveDispute}>
              <div className="modal-body" style={{ display: 'flex', gap: 24, padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                {/* Left Column: Original Invoice Info */}
                <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 24 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-main)' }}>{t('paymentverification.original_invoice_information')}</h4>
                  <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.invoice_period')}</span>
                      <strong style={{ fontSize: 15 }}>Tháng {selectedItem.invoiceMonth}/{selectedItem.invoiceYear}</strong>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.booth')}</span>
                      <strong style={{ fontSize: 15 }}>{selectedItem.stallCode} - {selectedItem.tenantName}</strong>
                    </div>
                    <div>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.total_invoice_amount')}</span>
                      <strong style={{ fontSize: 18, color: 'var(--primary)' }}>{formatCurrency(selectedItem.invoiceTotalAmount)}</strong>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.status')}</span>
                      <span className={`badge ${selectedItem.invoiceStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                        {selectedItem.invoiceStatus === 'Paid' ? t('paymentverification.collected') : t('paymentverification.waiting_for_collection')}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Dispute Resolution */}
                <div style={{ flex: 1.2 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-main)' }}>{t('paymentverification.content_of_appeal')}</h4>
                  <div className={`alert ${disputeApprove ? 'alert-success' : 'alert-danger'}`} style={{ marginBottom: 16 }}>
                    <Info size={16} className="alert-icon" />
                    <div>
                      <p style={{ fontWeight: 600 }}>{selectedItem.title}</p>
                      <p style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{selectedItem.description}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">{t('paymentverification.feedback_for_small_businesses')}</label>
                    <textarea className="form-textarea" rows={3} value={disputeFeedback} onChange={e => setDisputeFeedback(e.target.value)} />
                  </div>
                  {disputeApprove && (
                    <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}>
                        <input type="checkbox" checked={isRefund} onChange={e => setIsRefund(e.target.checked)} />
                        {selectedItem.invoiceStatus === 'Paid' ? t('paymentverification.make_refunds_directly_to') : t('paymentverification.adjust_deductions_directly_to')}
                      </label>
                      
                      {isRefund && (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label className="form-label">
                              {selectedItem.invoiceStatus === 'Paid' ? t('paymentverification.refund_amount_vnd') : t('paymentverification.deduction_amount_vnd')}
                            </label>
                            <input type="number" className="form-input" min={0} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder={t('paymentverification.enter_the_amount')} required={isRefund} />
                          </div>
                          
                          {selectedItem.invoiceStatus === 'Paid' && (
                            <>
                              <div>
                                <label className="form-label">{t('paymentverification.completion_method')}</label>
                                <select className="form-select" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                                  <option value="Transfer">{t('paymentverification.transfer')}</option>
                                  <option value="Cash">{t('paymentverification.cash')}</option>
                                </select>
                              </div>
                              {refundMethod === 'Transfer' && (
                                <div className="alert alert-info" style={{ marginTop: 0 }}>
                                  <Info size={16} className="alert-icon" />
                                  <div style={{ fontSize: 13 }}>
                                    <strong>{t('paymentverification.stk_small_business')}</strong> {selectedItem.vendorBankAccount || t('paymentverification.not_updated_yet')} <br/>
                                    <strong>{t('paymentverification.bank')}</strong> {selectedItem.vendorBankName || t('paymentverification.not_updated_yet')}
                                  </div>
                                </div>
                              )}
                              {refundMethod === 'Transfer' && (
                                <div>
                                  <label className="form-label">{t('paymentverification.transaction_code_if_any')}</label>
                                  <input type="text" className="form-input" value={transactionCode} onChange={e => setTransactionCode(e.target.value)} placeholder="VD: FT2605..." />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className={`btn ${disputeApprove ? 'btn-success' : 'btn-danger'}`}>
                  {disputeApprove ? <><ThumbsUp size={14} /> {t('paymentverification.accept')}</> : <><ThumbsDown size={14} /> {t('paymentverification.refuse')}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
