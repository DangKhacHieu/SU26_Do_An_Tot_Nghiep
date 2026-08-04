import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import {
  CheckCircle, XCircle, Search, DollarSign, Clock,
  ThumbsUp, ThumbsDown, AlertTriangle, RefreshCw, Bell,
  AlertCircle, FileText, MessageSquare, Building, X, Info, Printer
} from 'lucide-react';

const formatCurrency = (v) => (v || 0).toLocaleString('vi-VN') + ' ₫';
const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
};

const getPaymentStatusBadge = (s, t) => {
  if (s === 'Approved') return { cls: 'badge badge-success', label: t('paymentverification.payment_status_approved') };
  if (s === 'Pending') return { cls: 'badge badge-warning', label: t('paymentverification.payment_status_pending') };
  if (s === 'Rejected') return { cls: 'badge badge-danger', label: t('paymentverification.payment_status_rejected') };
  return { cls: 'badge badge-neutral', label: t('paymentverification.payment_status_other', { status: s }) };
};

const getDisputeStatusBadge = (s, t) => {
  if (s === 'Approved') return { cls: 'badge badge-success', label: t('paymentverification.dispute_status_approved') };
  if (s === 'Rejected') return { cls: 'badge badge-danger', label: t('paymentverification.dispute_status_rejected') };
  return { cls: 'badge badge-warning', label: t('paymentverification.dispute_status_pending') };
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
  const [modalError, setModalError] = useState('');
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
      fetch(`http://localhost:5056/api/accountant/payments/pending?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`http://localhost:5056/api/accountant/payments/debts?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); return r.json(); }),
      fetch(`http://localhost:5056/api/accountant/payments/disputes?userId=${userIdStr}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); return r.json(); })
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
    dueDate: '2026-05-25', createdAt: '2026-05-01T08:00:00Z', vendorPhone: '0901234567', invoiceType: 'Periodic',
    details: [
      { invoiceDetailId: 1, feeTypeName: t('paymentverification.premises_rent'), description: t('paymentverification.kiosk_rental_in_may'), quantity: 1, unitPrice: 3000000, amount: 3000000 },
      { invoiceDetailId: 2, feeTypeName: t('paymentverification.electricity_bills_for_daily'), description: t('paymentverification.electricity_consumption_80_kwh'), quantity: 80, unitPrice: 3000, amount: 240000 }
    ],
    payments: [
      { paymentId: 1, transactionCode: 'MOCK-TX-001', amount: 3240000, method: 'Cash', paidAt: '2026-05-20T10:30:00Z', status: 'Pending' }
    ]
  });
  const getMockStallDebtDetail = (stallId) => ({
    stallId, stallCode: stallId === 1 ? 'Kiosk B-12' : stallId === 2 ? 'Kiosk A-03' : 'Kiosk C-10',
    tenantName: stallId === 1 ? t('paymentverification.nguyen_van_hung') : stallId === 2 ? t('paymentverification.tran_thi_my') : t('paymentverification.pham_thanh_son'),
    unpaidInvoices: [{ invoiceId: 101, month: 5, year: 2026, totalAmount: stallId === 1 ? 5750000 : stallId === 2 ? 480000 : 10300000, status: 'Unpaid', dueDate: '2026-05-25' }],
    unpaidViolations: [{ violationId: 81, title: t('paymentverification.encroaching_the_hallway'), fineAmount: stallId === 1 ? 1500000 : stallId === 2 ? 500000 : 5000000 }]
  });

  const handleApprovePayment = (pay) => {
    if (!window.confirm(t('paymentverification.confirm_transaction_approval_paytransactioncode', { transactionCode: pay.transactionCode, amount: formatCurrency(pay.amount) }))) return;
    if (isMock) { setPayments(p => p.map(x => x.paymentId === pay.paymentId ? { ...x, status: 'Approved' } : x)); showNotification('success', t('paymentverification.successful_transaction_confirmed')); }
    else fetch(`http://localhost:5056/api/accountant/payments/${pay.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: true }) })
      .then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.successful_payment_confirmation')); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.unable_to_approve_payment')));
  };

  const submitRejectPayment = (e) => {
    e.preventDefault();
    setModalError('');
    
    // Validation for rejection note
    if (!rejectionNote || rejectionNote.trim() === '') {
      setModalError(t('paymentverification.please_enter_rejection_reason'));
      return;
    }
    
    if (isMock) { setPayments(p => p.filter(x => x.paymentId !== selectedItem.paymentId)); showNotification('success', t('paymentverification.selecteditemtransactioncode_transaction_declined')); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/${selectedItem.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: false, rejectionNote }) })
      .then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.payment_refused')); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.payment_cannot_be_refused')));
  };

  const handleViewOriginalInvoice = (invoiceId, stallCode) => {
    setLoadingPopup(true); setSelectedItem({ invoiceId, stallCode }); setActiveModal('invoice_detail');
    if (isMock) { setSelectedInvoiceDetail(getMockInvoiceDetail(invoiceId)); setLoadingPopup(false); }
    else fetch(`http://localhost:5056/api/accountant/billing/invoices/${invoiceId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(r.statusText); return r.json(); }).then(d => { setSelectedInvoiceDetail(d); setLoadingPopup(false); }).catch(() => { setSelectedInvoiceDetail(getMockInvoiceDetail(invoiceId)); setLoadingPopup(false); });
  };

  const handleViewDebtDetail = (debt) => {
    setLoadingPopup(true); setSelectedItem(debt); setActiveModal('debt_detail');
    if (isMock) { setSelectedInvoiceDetail(getMockStallDebtDetail(debt.stallId)); setLoadingPopup(false); }
    else fetch(`http://localhost:5056/api/accountant/payments/debts/${debt.stallId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }).then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(r.statusText); return r.json(); }).then(d => { setSelectedInvoiceDetail(d); setLoadingPopup(false); }).catch(() => { setSelectedInvoiceDetail(getMockStallDebtDetail(debt.stallId)); setLoadingPopup(false); });
  };

  const handlePrintStatement = () => {
    const printContent = document.getElementById('debt-statement-print')?.innerHTML;
    if (!printContent) return;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('paymentverification.debt_reconciliation_report')}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #000; line-height: 1.5; }
            h2, h3, h4 { margin: 0; padding: 0; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h2 { font-size: 22px; text-transform: uppercase; margin-bottom: 5px; }
            .header p { font-size: 14px; font-style: italic; }
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 15px; }
            .info-box { width: 48%; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; font-size: 14px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: left; }
            th { background-color: #f0f0f0; font-weight: bold; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .total-row td { font-weight: bold; background-color: #f9f9f9; }
            .signature-section { display: flex; justify-content: space-around; margin-top: 50px; text-align: center; }
            .signature-box { width: 200px; }
            .signature-box p { margin-top: 80px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>${t('paymentverification.debt_reconciliation_report_upper')}</h2>
            <p>${t('paymentverification.reconciliation_period', { date: new Date().toLocaleDateString('vi-VN') })}</p>
          </div>
          ${printContent}
          <div class="signature-section">
            <div class="signature-box">
              <strong>${t('paymentverification.customer_confirmation')}</strong>
              <p>${t('paymentverification.signature')}</p>
            </div>
            <div class="signature-box">
              <strong>${t('paymentverification.market_management_representative')}</strong>
              <p>${t('paymentverification.signature')}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handleSendReminderClick = (debt) => {
    setSelectedItem(debt);
    setReminderMessage(t('paymentverification.management_announced_store_debtstallcode', { stallCode: debt.stallCode, totalDebt: formatCurrency(debt.totalDebt) }));
    setActiveModal('send_reminder');
  };

  const submitSendReminder = (e) => {
    e.preventDefault();
    if (isMock) { showNotification('success', t('paymentverification.debt_reminder_sent_to')); setActiveModal(null); }
    else fetch('http://localhost:5056/api/accountant/payments/debts/notify?userId=1', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ stallId: selectedItem.stallId, customMessage: reminderMessage }) })
      .then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.debt_reminder_sent_successfully')); setActiveModal(null); })
      .catch(() => showNotification('danger', t('paymentverification.sending_debt_reminder_failed')));
  };

  const handleViewDisputeDetails = (dispute) => {
    setSelectedItem(dispute);
    setDisputeApprove(true);
    setDisputeFeedback('');
    setIsRefund(false);
    setRefundAmount('');
    setRefundMethod('Transfer');
    setTransactionCode('');
    setActiveModal('resolve_dispute');
    
    if (dispute.invoiceId) {
      if (isMock) {
        setSelectedInvoiceDetail(getMockInvoiceDetail(dispute.invoiceId));
      } else {
        fetch(`http://localhost:5056/api/accountant/billing/invoices/${dispute.invoiceId}`, { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } })
          .then(r => r.json())
          .then(d => setSelectedInvoiceDetail(d))
          .catch(() => setSelectedInvoiceDetail(null));
      }
    } else {
      setSelectedInvoiceDetail(null);
    }
  };

  const submitResolveDispute = (e) => {
    e.preventDefault();
    setModalError('');
    
    // Validation for dispute feedback
    if (!disputeFeedback || disputeFeedback.trim() === '') {
      setModalError(t('paymentverification.please_enter_dispute_feedback'));
      return;
    }
    
    // Validation for refund when isRefund is true
    if (isRefund) {
      if (!refundAmount || parseFloat(refundAmount) <= 0) {
        setModalError(t('paymentverification.refund_amount_must_be_positive'));
        return;
      }
      
      // Validate refund amount doesn't exceed invoice amount
      if (parseFloat(refundAmount) > selectedItem.invoiceTotalAmount) {
        setModalError(t('paymentverification.refund_amount_exceeds_invoice'));
        return;
      }
      
      // Validate transaction code for bank transfer (only for Paid invoices)
      if (selectedItem.invoiceStatus === 'Paid' && refundMethod === 'Transfer' && (!transactionCode || transactionCode.trim() === '')) {
        setModalError(t('paymentverification.please_enter_transaction_code') || 'Vui lòng nhập Mã giao dịch hoàn tiền.');
        return;
      }
    }
    
    if (isMock) { setDisputes(d => d.map(x => x.requestId === selectedItem.requestId ? { ...x, status: disputeApprove ? 'Approved' : 'Rejected' } : x)); showNotification('success', t('paymentverification.dispute_resolved_success', { action: disputeApprove ? t('paymentverification.accept') : t('paymentverification.refuse') })); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/disputes/${selectedItem.requestId}/resolve?userId=1`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, 
      body: JSON.stringify({ 
        approve: disputeApprove, 
        feedback: disputeFeedback,
        isRefund,
        refundAmount: isRefund ? (parseInt(refundAmount) || 0) : 0,
        refundMethod: (isRefund && selectedItem.invoiceStatus === 'Paid') ? refundMethod : null,
        transactionCode: (isRefund && selectedItem.invoiceStatus === 'Paid') ? transactionCode : null
      }) 
    })
      .then(r => { if (r.status === 401) { localStorage.removeItem('accessToken'); window.location.href = '/login'; throw new Error('401'); } if (!r.ok) throw new Error(); showNotification('success', t('paymentverification.appeal_responded_successfully')); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', t('paymentverification.appeal_processing_failed')));
  };

  const filteredPayments = payments
    .filter(p => [p.transactionCode, p.stallCode, p.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.paidAt || 0) - new Date(a.paidAt || 0);
    });
  const filteredDebts = debts.filter(d => [d.stallCode, d.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredDisputes = disputes
    .filter(d => [d.stallCode, d.tenantName, d.title].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())))
    .sort((a, b) => {
      if (a.status === 'Pending' && b.status !== 'Pending') return -1;
      if (a.status !== 'Pending' && b.status === 'Pending') return 1;
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  // --- Chức năng tính Tuổi Nợ (Debt Aging) ---
  const getDebtAgingInfo = (lastDueDate) => {
    if (!lastDueDate) return { status: t('paymentverification.debt_aging_undefined'), color: 'neutral', days: 0 };
    const due = new Date(lastDueDate);
    const now = new Date();
    // Bỏ qua giờ phút
    due.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diffTime = now - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return { status: t('paymentverification.debt_aging_within'), color: 'success', days: 0 };
    if (diffDays <= 30) return { status: t('paymentverification.debt_aging_overdue', { days: diffDays }), color: 'warning', days: diffDays };
    if (diffDays <= 90) return { status: t('paymentverification.debt_aging_overdue', { days: diffDays }), color: 'danger', days: diffDays };
    return { status: t('paymentverification.debt_aging_risk', { days: diffDays }), color: 'danger', days: diffDays };
  };

  // Tính toán Mini Dashboard cho Dư Nợ
  const totalDebtAmount = debts.reduce((sum, d) => sum + d.totalDebt, 0);
  const totalStallsInDebt = debts.length;
  const highRiskDebt = debts.filter(d => getDebtAgingInfo(d.lastDueDate).days > 30).reduce((sum, d) => sum + d.totalDebt, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ display: "none" }}>
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
          <button className="acc-btn-ghost btn-sm btn-icon" onClick={() => setNotification(null)}><X size={14} /></button>
        </div>
      )}
      {isMock && (
        <div className="alert alert-warning">
          <AlertTriangle size={16} className="alert-icon" />
          <span><strong>{t('paymentverification.simulation_mode')}</strong> {t('paymentverification.showing_alternative_simulation_data')}</span>
        </div>
      )}

      {/* Search */}
      <div className="acc-card" style={{ padding: '14px 20px' }}>
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
      <div className="acc-tabs-header">
        {[
          { id: 'verification', label: t('paymentverification.transaction_reconciliation'), icon: Clock },
          { id: 'debts', label: t('paymentverification.monitor_outstanding_balances'), icon: Building },
          { id: 'disputes', label: t('paymentverification.invoice_appeal'), icon: MessageSquare }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} className={`acc-tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => { setActiveTab(tab.id); setSearchQuery(''); }}>
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
              <table className="acc-table">
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
                      const { cls, label } = getPaymentStatusBadge(pay.status, t);
                    return (
                      <tr key={pay.paymentId}>
                        <td><span style={{ fontFamily: 'monospace', fontSize: 12.5, fontWeight: 600 }}>{pay.transactionCode}</span></td>
                        <td>
                          <div><strong>{pay.stallCode}</strong></div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{pay.tenantName}</div>
                        </td>
                        <td><span className="acc-badge neutral">{pay.method}</span></td>
                        <td><span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{formatDate(pay.paidAt)}</span></td>
                        <td className="text-right"><strong style={{ color: 'var(--text-title)' }}>{formatCurrency(pay.amount)}</strong></td>
                        <td><span className={cls}>{label}</span></td>
                        <td className="text-right">
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' }}>
                            <button className="acc-btn-secondary btn-sm" onClick={() => handleViewOriginalInvoice(pay.invoiceId, pay.stallCode)}>
                              <FileText size={13} /> {t('paymentverification.original_contract')}</button>
                            {pay.status === 'Pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprovePayment(pay)}>
                                  <ThumbsUp size={13} /> {t('paymentverification.browse')}</button>
                                <button className="acc-btn-danger btn-sm" onClick={() => { setSelectedItem(pay); setRejectionNote(''); setActiveModal('reject_payment'); }}>
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
                    {t('paymentverification.show_paginated_transactions', { start: ((paymentsPage - 1) * itemsPerPage) + 1, end: Math.min(paymentsPage * itemsPerPage, filteredPayments.length), total: filteredPayments.length })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
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
                      className="acc-btn-secondary btn-sm" 
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Mini Dashboard cho Dư Nợ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="acc-card" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>{t('paymentverification.total_market_debt')}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-title)', marginTop: '8px' }}>{formatCurrency(totalDebtAmount)}</div>
                </div>
                <div className="acc-card" style={{ padding: '20px', borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>{t('paymentverification.high_overdue_debt')}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--danger)', marginTop: '8px' }}>{formatCurrency(highRiskDebt)}</div>
                </div>
                <div className="acc-card" style={{ padding: '20px', borderLeft: '4px solid var(--warning)' }}>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600' }}>{t('paymentverification.number_of_stalls_in_debt')}</div>
                  <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-title)', marginTop: '8px' }}>{t('paymentverification.stall_count', { count: totalStallsInDebt })}</div>
                </div>
              </div>

              <div className="acc-card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{t('paymentverification.debt_list')}</h3>
                </div>
                <table className="acc-table">
                  <thead>
                    <tr>
                      <th>{t('paymentverification.stallssmall_traders')}</th>
                      <th>{t('paymentverification.debt_age')}</th>
                      <th className="text-right">{t('paymentverification.fees_rent')}</th>
                      <th className="text-right">{t('paymentverification.violation_fine')}</th>
                      <th className="text-right">{t('paymentverification.ending_debt_balance')}</th>
                      <th className="text-right">{t('paymentverification.operation')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDebts.length > 0 ? filteredDebts.slice((debtsPage - 1) * itemsPerPage, debtsPage * itemsPerPage).map(debt => {
                      const aging = getDebtAgingInfo(debt.lastDueDate);
                      return (
                        <tr key={debt.stallId}>
                          <td>
                            <div style={{ fontWeight: '700', color: 'var(--text-title)' }}>{debt.stallCode}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{debt.tenantName}</div>
                          </td>
                          <td>
                            <span className={`acc-badge ${aging.color}`}>{aging.status}</span>
                          </td>
                          <td className="text-right">
                            {debt.rentDebt + debt.utilityDebt > 0 ? 
                              <span style={{ fontWeight: 600 }}>{formatCurrency(debt.rentDebt + debt.utilityDebt)}</span> 
                              : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td className="text-right">
                            {debt.violationDebt > 0 ? 
                              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>{formatCurrency(debt.violationDebt)}</span> 
                              : <span style={{ color: 'var(--text-muted)' }}>-</span>}
                          </td>
                          <td className="text-right">
                            <strong style={{ color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(debt.totalDebt)}</strong>
                          </td>
                          <td className="text-right">
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button className="acc-btn-secondary btn-sm" onClick={() => handleViewDebtDetail(debt)}><FileText size={13} /> {t('paymentverification.detail')}</button>
                              <button className="acc-btn-primary btn-sm" onClick={() => handleSendReminderClick(debt)}><Bell size={13} /> {t('paymentverification.send_reminder_btn')}</button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={6}><div className="empty-state"><div className="empty-state-icon"><DollarSign size={24} /></div><p className="empty-state-title">{t('paymentverification.no_debts_found')}</p></div></td></tr>
                    )}
                  </tbody>
                </table>
                {filteredDebts.length > itemsPerPage && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, padding: '16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                      {t('paymentverification.show_paginated_debts', { start: ((debtsPage - 1) * itemsPerPage) + 1, end: Math.min(debtsPage * itemsPerPage, filteredDebts.length), total: filteredDebts.length })}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button 
                        className="acc-btn-secondary btn-sm" 
                        onClick={() => setDebtsPage(prev => Math.max(prev - 1, 1))} 
                        disabled={debtsPage === 1}
                      >
                        {t('paymentverification.before')}
                      </button>
                      {Array.from({ length: Math.ceil(filteredDebts.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page} 
                          className={`acc-btn-secondary btn-sm ${debtsPage === page ? 'active' : ''}`}
                          onClick={() => setDebtsPage(page)}
                          style={debtsPage === page ? { backgroundColor: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}
                        >
                          {page}
                        </button>
                      ))}
                      <button 
                        className="acc-btn-secondary btn-sm" 
                        onClick={() => setDebtsPage(prev => Math.min(prev + 1, Math.ceil(filteredDebts.length / itemsPerPage)))} 
                        disabled={debtsPage === Math.ceil(filteredDebts.length / itemsPerPage)}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DISPUTES */}
          {activeTab === 'disputes' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="acc-table">
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
                    const { cls, label } = getDisputeStatusBadge(dis.status, t);
                    return (
                      <tr key={dis.requestId}>
                        <td>
                          <div><strong>{dis.stallCode}</strong></div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dis.tenantName}</div>
                        </td>
                        <td><span style={{ fontWeight: 600, fontSize: 13 }}>{dis.title}</span></td>
                        <td><span className="acc-badge neutral">Th.{dis.invoiceMonth}/{dis.invoiceYear}</span></td>
                        <td className="text-right"><strong>{formatCurrency(dis.invoiceTotalAmount)}</strong></td>
                        <td><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{formatDate(dis.createdAt)}</span></td>
                        <td><span className={cls}>{label}</span></td>
                        <td className="text-right">
                          {dis.status === 'Pending' && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                              <button className="acc-btn-primary btn-sm" onClick={() => handleViewDisputeDetails(dis)}>
                                <Info size={13} /> {t('paymentverification.detail') || 'Xem chi tiết'}
                              </button>
                            </div>
                          )}
                          {dis.status !== 'Pending' && <span className="acc-badge neutral">{t('paymentverification.processed')}</span>}
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
                    {t('paymentverification.show_paginated_disputes', { start: ((disputesPage - 1) * itemsPerPage) + 1, end: Math.min(disputesPage * itemsPerPage, filteredDisputes.length), total: filteredDisputes.length })}
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      className="acc-btn-secondary btn-sm" 
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
                      className="acc-btn-secondary btn-sm" 
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
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="acc-modal-container" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('paymentverification.reject_transaction_title', { code: selectedItem.transactionCode })}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitRejectPayment}>
              <div className="acc-modal-body">
                {modalError ? <p className="form-error">{modalError}</p> : null}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 13.5 }}>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.stall')}</span><strong>{selectedItem.stallCode}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.small_business')}</span>{selectedItem.tenantName}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.amount')}</span><strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedItem.amount)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>{t('paymentverification.method')}</span>{selectedItem.method}</div>
                </div>
                <div>
                  <label className="acc-form-label">{t('paymentverification.reason_for_refusal')}<span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea className="form-textarea" rows={4} required
                    placeholder={t('paymentverification.specify_the_reason_wrong')}
                    value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className="acc-btn-danger">{t('paymentverification.confirmed_refusal')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Invoice Detail */}
      {activeModal === 'invoice_detail' && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('paymentverification.original_invoice_detail_title', { stallCode: selectedItem?.stallCode })}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              {loadingPopup ? (
                <div className="loading-container" style={{ padding: 40 }}>
                  <div className="loading-spinner" /><p className="loading-text">{t('paymentverification.loading')}</p>
                </div>
              ) : selectedInvoiceDetail && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', background: '#f8fafc', padding: '16px 20px', borderRadius: '8px', fontSize: 14, border: '1px solid var(--border-color)', marginBottom: 20 }}>
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.stall')}</span><strong>{selectedInvoiceDetail.stallCode}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.invoice_period')}</span><strong>Tháng {selectedInvoiceDetail.month}/{selectedInvoiceDetail.year}</strong></div>
                    
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.small_business')}</span><strong>{selectedInvoiceDetail.vendorName}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.phone') || 'Số điện thoại:'}</span><strong>{selectedInvoiceDetail.vendorPhone || 'N/A'}</strong></div>
                    
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.issue_date') || 'Ngày phát hành:'}</span><strong>{selectedInvoiceDetail.createdAt ? formatDate(selectedInvoiceDetail.createdAt) : '—'}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.due_date') || 'Hạn chót:'}</span><strong style={{ color: 'var(--danger)' }}>{selectedInvoiceDetail.dueDate ? formatDate(selectedInvoiceDetail.dueDate) : '—'}</strong></div>
                    
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.invoice_type') || 'Loại hóa đơn:'}</span><strong>{selectedInvoiceDetail.invoiceType === 'AdHoc' ? 'Đột xuất' : (selectedInvoiceDetail.invoiceType === 'Adjustment' ? 'Điều chỉnh' : 'Định kỳ')}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)', marginRight: '8px', display: 'inline-block', width: '120px' }}>{t('paymentverification.status')}</span><span className={`badge ${selectedInvoiceDetail.status === 'Paid' ? 'badge-success' : selectedInvoiceDetail.status === 'Unpaid' ? 'badge-warning' : 'badge-neutral'}`}>{selectedInvoiceDetail.status}</span></div>
                  </div>
                  <table className="acc-table">
                    <thead><tr><th>{t('paymentverification.fees')}</th><th>{t('paymentverification.describe')}</th><th className="text-right">{t('paymentverification.quantity')}</th><th className="text-right">{t('paymentverification.unit_price')}</th><th className="text-right" style={{ whiteSpace: 'nowrap' }}>{t('paymentverification.make_money')}</th></tr></thead>
                    <tbody>
                      {selectedInvoiceDetail.details?.map((d, i) => (
                        <tr key={i}>
                          <td><strong>{d.feeTypeName}</strong></td>
                          <td style={{ color: 'var(--text-muted)' }}>{d.description}</td>
                          <td className="text-right">{d.quantity}</td>
                          <td className="text-right" style={{ whiteSpace: 'nowrap' }}>{d.unitPrice.toLocaleString('vi-VN')} ₫</td>
                          <td className="text-right" style={{ whiteSpace: 'nowrap' }}><strong>{d.amount.toLocaleString('vi-VN')} ₫</strong></td>
                        </tr>
                      ))}
                      <tr style={{ background: 'var(--primary-light)', fontWeight: 800 }}>
                        <td colSpan={4} className="text-right">{t('paymentverification.total')}</td>
                        <td className="text-right" style={{ color: 'var(--primary)', fontSize: 15, whiteSpace: 'nowrap' }}>{formatCurrency(selectedInvoiceDetail.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                  {selectedInvoiceDetail.payments && selectedInvoiceDetail.payments.length > 0 && (
                    <div style={{ marginTop: 24 }}>
                      <h4 style={{ fontSize: 15, marginBottom: 12, color: 'var(--text-main)', fontWeight: 600 }}>{t('paymentverification.payment_history') || 'Lịch sử thanh toán'}</h4>
                      <table className="acc-table" style={{ fontSize: 13, border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f1f5f9' }}>
                            <th style={{ padding: '10px 16px' }}>{t('paymentverification.transaction_code') || 'Mã giao dịch'}</th>
                            <th style={{ padding: '10px 16px' }}>{t('paymentverification.payment_date') || 'Ngày thanh toán'}</th>
                            <th style={{ padding: '10px 16px' }}>{t('paymentverification.method') || 'Phương thức'}</th>
                            <th className="text-right" style={{ padding: '10px 16px' }}>{t('paymentverification.amount') || 'Số tiền'}</th>
                            <th style={{ padding: '10px 16px' }}>{t('paymentverification.status')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceDetail.payments.map((p, idx) => (
                            <tr key={idx}>
                              <td style={{ padding: '10px 16px' }}><strong>{p.transactionCode}</strong></td>
                              <td style={{ padding: '10px 16px' }}>{formatDate(p.paidAt)}</td>
                              <td style={{ padding: '10px 16px' }}>{p.method === 'Transfer' ? 'Chuyển khoản' : 'Tiền mặt'}</td>
                              <td className="text-right" style={{ color: 'var(--success)', fontWeight: 'bold', padding: '10px 16px' }}>{formatCurrency(p.amount)}</td>
                              <td style={{ padding: '10px 16px' }}><span className={`badge ${p.status === 'Approved' ? 'badge-success' : p.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>{p.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="acc-modal-footer"><button className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.close')}</button></div>
          </div>
        </div>
      )}

      {/* Modal: Debt Detail */}
      {activeModal === 'debt_detail' && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container modal-container-lg" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('paymentverification.debt_reconciliation_report')} — {selectedItem?.stallCode}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <div className="acc-modal-body">
              {loadingPopup ? (
                <div className="loading-container" style={{ padding: 40 }}><div className="loading-spinner" /></div>
              ) : selectedInvoiceDetail && (
                <div id="debt-statement-print">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', borderBottom: '1px dashed var(--border)', paddingBottom: '15px' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('paymentverification.stall_code_label')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedInvoiceDetail.stallCode}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('paymentverification.customer_label')}</div>
                      <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedInvoiceDetail.tenantName}</div>
                    </div>
                  </div>

                  {selectedInvoiceDetail.unpaidInvoices?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-title)' }}>{t('paymentverification.fees_group_title')}</h4>
                      <table className="acc-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>{t('paymentverification.invoice_code')}</th>
                            <th>{t('paymentverification.payment_period')}</th>
                            <th>{t('paymentverification.due_date')}</th>
                            <th>{t('paymentverification.status')}</th>
                            <th className="text-right">{t('paymentverification.amount_col')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceDetail.unpaidInvoices.map(inv => (
                            <tr key={inv.invoiceId}>
                              <td style={{ fontFamily: 'monospace' }}>INV-{inv.invoiceId}</td>
                              <td>{t('paymentverification.month_year', { month: inv.month, year: inv.year })}</td>
                              <td>{inv.dueDate}</td>
                              <td>{inv.status}</td>
                              <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(inv.totalAmount)}</strong></td>
                            </tr>
                          ))}
                          <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                            <td colSpan="4" className="text-right" style={{ fontWeight: 'bold' }}>{t('paymentverification.total_fees_label')}</td>
                            <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedInvoiceDetail.unpaidInvoices.reduce((s, i) => s + i.totalAmount, 0))}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {selectedInvoiceDetail.unpaidViolations?.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ fontSize: '14px', marginBottom: '10px', color: 'var(--text-title)' }}>{t('paymentverification.violations_group_title')}</h4>
                      <table className="acc-table" style={{ fontSize: '13px' }}>
                        <thead>
                          <tr>
                            <th>{t('paymentverification.violation_content')}</th>
                            <th className="text-right">{t('paymentverification.fine_amount_col')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedInvoiceDetail.unpaidViolations.map(v => (
                            <tr key={v.violationId}>
                              <td>{v.title}</td>
                              <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(v.fineAmount)}</strong></td>
                            </tr>
                          ))}
                          <tr style={{ backgroundColor: 'var(--bg-base)' }}>
                            <td className="text-right" style={{ fontWeight: 'bold' }}>{t('paymentverification.total_violations_label')}</td>
                            <td className="text-right"><strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedInvoiceDetail.unpaidViolations.reduce((s, v) => s + v.fineAmount, 0))}</strong></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--danger-light)', padding: '15px', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                    <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{t('paymentverification.total_payable_label')}</span>
                    <strong style={{ color: 'var(--danger)', fontSize: '20px' }}>
                      {formatCurrency(
                        (selectedInvoiceDetail.unpaidInvoices?.reduce((s, i) => s + i.totalAmount, 0) || 0) + 
                        (selectedInvoiceDetail.unpaidViolations?.reduce((s, v) => s + v.fineAmount, 0) || 0)
                      )}
                    </strong>
                  </div>
                </div>
              )}
            </div>
            <div className="acc-modal-footer">
              <button className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.close')}</button>
              <button className="acc-btn-primary" onClick={handlePrintStatement} disabled={loadingPopup || !selectedInvoiceDetail}>
                <Printer size={16} /> {t('paymentverification.print_statement')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Send Reminder */}
      {activeModal === 'send_reminder' && selectedItem && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="acc-modal-container" onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('paymentverification.send_reminder_title', { code: selectedItem.stallCode })}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitSendReminder}>
              <div className="acc-modal-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--danger-light)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger-border)' }}>
                  <span style={{ fontSize: 13 }}>{t('paymentverification.total_current_debt')}</span>
                  <strong style={{ color: 'var(--danger)', fontSize: 16 }}>{formatCurrency(selectedItem.totalDebt)}</strong>
                </div>
                <div>
                  <label className="acc-form-label">{t('paymentverification.notification_content')}</label>
                  <textarea className="form-textarea" rows={5} value={reminderMessage} onChange={e => setReminderMessage(e.target.value)} />
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className="acc-btn-primary"><Bell size={14} /> {t('paymentverification.send_notification')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {activeModal === 'resolve_dispute' && selectedItem && (
        <div className="acc-modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="acc-modal-container" style={{ maxWidth: 850, width: '100%' }} onClick={e => e.stopPropagation()}>
            <div className="acc-modal-header">
              <span className="acc-modal-title">{t('paymentverification.detail') || 'Chi tiết Kháng nghị'}</span>
              <button className="acc-modal-close" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitResolveDispute}>
              <div className="acc-modal-body" style={{ display: 'flex', gap: 24, padding: '24px', overflowY: 'auto', maxHeight: '70vh' }}>
                {modalError ? <p className="form-error">{modalError}</p> : null}
                {/* Left Column: Original Invoice Info */}
                <div style={{ flex: 1, borderRight: '1px solid var(--border-color)', paddingRight: 24 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-main)' }}>{t('paymentverification.original_invoice_information')}</h4>
                  <div style={{ padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div>
                        <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.invoice_period')}</span>
                        <strong style={{ fontSize: 15 }}>{t('paymentverification.month_year', { month: selectedItem.invoiceMonth, year: selectedItem.invoiceYear })}</strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.status')}</span>
                        <span className={`badge ${selectedItem.invoiceStatus === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                          {selectedItem.invoiceStatus}
                        </span>
                      </div>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.booth')}</span>
                      <strong style={{ fontSize: 15 }}>{selectedItem.stallCode} - {selectedItem.tenantName}</strong>
                    </div>

                    {selectedInvoiceDetail && selectedInvoiceDetail.details && (
                      <div style={{ marginBottom: 16, borderTop: '1px dashed #cbd5e1', paddingTop: 12 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block', marginBottom: 8 }}>{t('paymentverification.invoice_details', 'Chi tiết các khoản phí')}</span>
                        <div style={{ maxHeight: 200, overflowY: 'auto', paddingRight: 4 }}>
                          {selectedInvoiceDetail.details.map((d, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, backgroundColor: '#fff', padding: '8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              <div style={{ flex: 1, paddingRight: 8 }}>
                                <div style={{ fontWeight: 600 }}>{d.feeTypeName}</div>
                                <div style={{ color: 'var(--text-light)', fontSize: 12 }}>{d.description} {d.quantity > 1 ? `(x${d.quantity})` : ''}</div>
                              </div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', alignSelf: 'center' }}>
                                {formatCurrency(d.amount)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-light)', display: 'block' }}>{t('paymentverification.total_invoice_amount')}</span>
                      <strong style={{ fontSize: 20, color: 'var(--primary)' }}>{formatCurrency(selectedItem.invoiceTotalAmount)}</strong>
                    </div>
                  </div>
                </div>
                
                {/* Right Column: Dispute Resolution */}
                <div style={{ flex: 1.2 }}>
                  <h4 style={{ margin: '0 0 16px 0', fontSize: 16, color: 'var(--text-main)' }}>{t('paymentverification.content_of_appeal')}</h4>
                  <div className="alert alert-neutral" style={{ marginBottom: 16 }}>
                    <Info size={16} className="alert-icon" />
                    <div>
                      <p style={{ fontWeight: 600 }}>{selectedItem.title}</p>
                      <p style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{selectedItem.description}</p>
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <label className="acc-form-label">{t('paymentverification.handling_decision')}</label>
                    <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="radio" name="decision" checked={disputeApprove === true} onChange={() => { setDisputeApprove(true); setDisputeFeedback(''); }} />
                        <ThumbsUp size={16} style={{ color: 'var(--success)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t('paymentverification.accept') || 'Chấp thuận'}</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="radio" name="decision" checked={disputeApprove === false} onChange={() => { setDisputeApprove(false); setDisputeFeedback(''); }} />
                        <ThumbsDown size={16} style={{ color: 'var(--danger)' }} />
                        <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{t('paymentverification.refuse') || 'Từ chối'}</span>
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="acc-form-label">{t('paymentverification.feedback_for_small_businesses')}</label>
                    <textarea className="form-textarea" rows={3} value={disputeFeedback} onChange={e => setDisputeFeedback(e.target.value)} />
                  </div>
                  {disputeApprove && (
                    <div style={{ padding: 12, border: '1px solid var(--border-color)', borderRadius: 8, backgroundColor: '#f8fafc' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 600, color: 'var(--primary)' }}>
                        <input type="checkbox" checked={isRefund} onChange={e => setIsRefund(e.target.checked)} />
                        {selectedItem.invoiceStatus === 'Paid' ? t('paymentverification.make_refunds_directly_to') : t('paymentverification.adjust_deductions_directly_to')}
                      </label>
                      
                      {isRefund ? (
                        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
                          <div>
                            <label className="acc-form-label">
                              {selectedItem.invoiceStatus === 'Paid' ? t('paymentverification.refund_amount_vnd') : t('paymentverification.deduction_amount_vnd')}
                            </label>
                            <input type="number" className="acc-input" min={0} max={selectedItem.invoiceTotalAmount} value={refundAmount} onChange={e => setRefundAmount(e.target.value)} placeholder={t('paymentverification.enter_the_amount')} required />
                            <small style={{ color: 'var(--text-light)', fontSize: 12 }}>{t('paymentverification.max_amount_note', { amount: formatCurrency(selectedItem.invoiceTotalAmount) })}</small>
                          </div>
                          
                          {selectedItem.invoiceStatus === 'Paid' && (
                            <>
                              <div>
                                <label className="acc-form-label">{t('paymentverification.completion_method')}</label>
                                <select className="form-select" value={refundMethod} onChange={e => setRefundMethod(e.target.value)}>
                                  <option value="Transfer">{t('paymentverification.transfer')}</option>
                                  <option value="Cash">{t('paymentverification.cash')}</option>
                                </select>
                              </div>
                              
                              {refundMethod === 'Transfer' && (
                                <>
                                  {/* Hiển thị thông tin ngân hàng khi chọn chuyển khoản */}
                                  <div className="alert alert-info" style={{ marginTop: 0 }}>
                                    <Info size={16} className="alert-icon" />
                                    <div style={{ fontSize: 13 }}>
                                      <strong>{t('paymentverification.stk_small_business')}</strong> {selectedItem.vendorBankAccount || t('paymentverification.not_updated_yet')} <br/>
                                      <strong>{t('paymentverification.bank')}</strong> {selectedItem.vendorBankName || t('paymentverification.not_updated_yet')}
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <label className="acc-form-label">
                                      {t('paymentverification.transaction_code') || 'Mã giao dịch'} <span style={{ color: 'red' }}>*</span>
                                    </label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <input type="text" className="acc-input" style={{ flex: 1 }} value={transactionCode} onChange={e => setTransactionCode(e.target.value)} placeholder="VD: FT2605..." />
                                    </div>
                                  </div>
                                </>
                              )}
                              
                              {refundMethod === 'Cash' && (
                                <div className="alert alert-neutral" style={{ marginTop: 0 }}>
                                  <Info size={16} className="alert-icon" />
                                  <div style={{ fontSize: 13 }}>
                                    {t('paymentverification.cash_refund_note')}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#fffbeb', borderRadius: 6, border: '1px solid #fcd34d' }}>
                          <small style={{ color: '#92400e' }}>
                            {t('paymentverification.no_refund_note')}
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="acc-modal-footer">
                <button type="button" className="acc-btn-secondary" onClick={() => setActiveModal(null)}>{t('paymentverification.cancel')}</button>
                <button type="submit" className="acc-btn-primary">
                  {t('paymentverification.confirm') || 'Xác nhận xử lý'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
