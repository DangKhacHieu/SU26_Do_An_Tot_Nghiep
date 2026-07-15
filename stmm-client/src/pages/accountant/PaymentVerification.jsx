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
    { paymentId: 10, transactionCode: 'FT2605892309', method: 'Chuyển khoản NH', amount: 3240000, paidAt: '2026-06-03T10:20:00Z', invoiceId: 5, stallCode: 'Kiosk B-05', tenantName: 'Trần Thị B', status: 'Pending' },
    { paymentId: 11, transactionCode: 'FT2605892288', method: 'Chuyển khoản NH', amount: 15000000, paidAt: '2026-06-02T15:45:00Z', invoiceId: 6, stallCode: 'Kiosk E-01', tenantName: 'Hoàng Thị E', status: 'Pending' },
    { paymentId: 12, transactionCode: 'CASH-9092', method: 'Tiền mặt', amount: 2000000, paidAt: '2026-06-01T14:15:00Z', invoiceId: 7, stallCode: 'Kiosk A-10', tenantName: 'Lê Hoàng D', status: 'Pending' },
    { paymentId: 8, transactionCode: 'FT2605891102', method: 'Chuyển khoản NH', amount: 12500000, paidAt: '2026-05-30T09:30:00Z', invoiceId: 3, stallCode: 'Kiosk A-12', tenantName: 'Nguyễn Văn A', status: 'Approved' }
  ];
  const getMockDebts = () => [
    { stallId: 1, stallCode: 'Kiosk B-12', tenantName: 'Nguyễn Văn Hùng', rentDebt: 4500000, utilityDebt: 1250000, violationDebt: 1500000, totalDebt: 7250000, lastDueDate: '2026-05-25' },
    { stallId: 2, stallCode: 'Kiosk A-03', tenantName: 'Trần Thị Mỹ', rentDebt: 0, utilityDebt: 480000, violationDebt: 500000, totalDebt: 980000, lastDueDate: '2026-05-25' },
    { stallId: 3, stallCode: 'Kiosk C-10', tenantName: 'Phạm Thanh Sơn', rentDebt: 8000000, utilityDebt: 2300000, violationDebt: 5000000, totalDebt: 15300000, lastDueDate: '2026-05-25' }
  ];
  const getMockDisputes = () => [
    { requestId: 51, invoiceId: 5, title: 'Sai lệch số nước sạch', description: 'Chỉ số nước đầu kỳ ghi nhận sai lệch 15m3 so với đồng hồ thực tế.', status: 'Pending', createdAt: '2026-06-02T08:15:00Z', stallCode: 'Kiosk B-05', tenantName: 'Trần Thị B', invoiceMonth: 5, invoiceYear: 2026, invoiceTotalAmount: 3240000 },
    { requestId: 48, invoiceId: 3, title: 'Tính thừa tiền dịch vụ vệ sinh', description: 'Gia đình đã đăng ký tạm ngưng dịch vụ thu gom rác nhưng hóa đơn vẫn tính phụ thu.', status: 'Approved', createdAt: '2026-05-28T14:40:00Z', stallCode: 'Kiosk A-12', tenantName: 'Nguyễn Văn A', invoiceMonth: 5, invoiceYear: 2026, invoiceTotalAmount: 12500000 }
  ];
  const getMockInvoiceDetail = (invoiceId) => ({
    invoiceId, month: 5, year: 2026, totalAmount: 3240000, status: 'Unpaid',
    stallCode: 'Kiosk B-05', vendorName: 'Trần Thị B',
    details: [
      { invoiceDetailId: 1, feeTypeName: 'Tiền thuê mặt bằng', description: 'Tiền thuê Kiosk tháng 5/2026', quantity: 1, unitPrice: 3000000, amount: 3000000 },
      { invoiceDetailId: 2, feeTypeName: 'Tiền điện sinh hoạt', description: 'Tiêu thụ điện (80 kWh)', quantity: 80, unitPrice: 3000, amount: 240000 }
    ]
  });
  const getMockStallDebtDetail = (stallId) => ({
    stallId, stallCode: stallId === 1 ? 'Kiosk B-12' : stallId === 2 ? 'Kiosk A-03' : 'Kiosk C-10',
    tenantName: stallId === 1 ? 'Nguyễn Văn Hùng' : stallId === 2 ? 'Trần Thị Mỹ' : 'Phạm Thanh Sơn',
    unpaidInvoices: [{ invoiceId: 101, month: 5, year: 2026, totalAmount: stallId === 1 ? 5750000 : stallId === 2 ? 480000 : 10300000, status: 'Unpaid', dueDate: '2026-05-25' }],
    unpaidViolations: [{ violationId: 81, title: 'Lấn chiếm hành lang', fineAmount: stallId === 1 ? 1500000 : stallId === 2 ? 500000 : 5000000 }]
  });

  const handleApprovePayment = (pay) => {
    if (!window.confirm(`Xác nhận duyệt giao dịch ${pay.transactionCode} — ${formatCurrency(pay.amount)}?`)) return;
    if (isMock) { setPayments(p => p.map(x => x.paymentId === pay.paymentId ? { ...x, status: 'Approved' } : x)); showNotification('success', 'Đã xác nhận giao dịch thành công!'); }
    else fetch(`http://localhost:5056/api/accountant/payments/${pay.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: true }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Xác nhận thanh toán thành công!'); loadAllData(); })
      .catch(() => showNotification('danger', 'Không thể duyệt thanh toán.'));
  };

  const submitRejectPayment = (e) => {
    e.preventDefault();
    if (isMock) { setPayments(p => p.filter(x => x.paymentId !== selectedItem.paymentId)); showNotification('success', `Đã từ chối giao dịch ${selectedItem.transactionCode}!`); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/${selectedItem.paymentId}/verify?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: false, rejectionNote }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Đã từ chối thanh toán!'); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', 'Không thể từ chối thanh toán.'));
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
    setReminderMessage(`Ban quản lý thông báo: Sạp ${debt.stallCode} đang có tổng nợ ${formatCurrency(debt.totalDebt)}. Kính đề nghị Quý khách thanh toán sớm nhất.`);
    setActiveModal('send_reminder');
  };

  const submitSendReminder = (e) => {
    e.preventDefault();
    if (isMock) { showNotification('success', `Đã gửi thông báo nhắc nợ tới sạp ${selectedItem.stallCode}!`); setActiveModal(null); }
    else fetch('http://localhost:5056/api/accountant/payments/debts/notify?userId=1', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ stallId: selectedItem.stallId, customMessage: reminderMessage }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Gửi thông báo nhắc nợ thành công!'); setActiveModal(null); })
      .catch(() => showNotification('danger', 'Gửi nhắc nợ thất bại.'));
  };

  const handleResolveDisputeClick = (dispute, approve) => {
    setSelectedItem(dispute); setDisputeApprove(approve);
    setDisputeFeedback(approve ? 'Đã ghi nhận phản ánh. Kế toán sẽ điều chỉnh hóa đơn giảm trừ.' : 'Từ chối giải quyết. Chỉ số trùng khớp với biên bản ghi nhận.');
    setActiveModal('resolve_dispute');
  };

  const submitResolveDispute = (e) => {
    e.preventDefault();
    if (isMock) { setDisputes(d => d.map(x => x.requestId === selectedItem.requestId ? { ...x, status: disputeApprove ? 'Approved' : 'Rejected' } : x)); showNotification('success', `Đã ${disputeApprove ? 'chấp nhận' : 'từ chối'} kháng nghị!`); setActiveModal(null); }
    else fetch(`http://localhost:5056/api/accountant/payments/disputes/${selectedItem.requestId}/resolve?userId=1`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }, body: JSON.stringify({ approve: disputeApprove, feedback: disputeFeedback }) })
      .then(r => { if (!r.ok) throw new Error(); showNotification('success', 'Đã phản hồi kháng nghị thành công!'); setActiveModal(null); loadAllData(); })
      .catch(() => showNotification('danger', 'Xử lý kháng nghị thất bại.'));
  };

  const filteredPayments = payments.filter(p => [p.transactionCode, p.stallCode, p.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredDebts = debts.filter(d => [d.stallCode, d.tenantName].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));
  const filteredDisputes = disputes.filter(d => [d.stallCode, d.tenantName, d.title].some(s => s.toLowerCase().includes(searchQuery.toLowerCase())));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Xác Minh Thanh Toán &amp; Dư Nợ</h1>
          <p className="page-subtitle">Đối soát giao dịch, quản lý dư nợ và xử lý kháng nghị hóa đơn.</p>
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
          <span><strong>Chế độ mô phỏng:</strong> Đang hiển thị dữ liệu mô phỏng thay thế.</span>
        </div>
      )}

      {/* Search */}
      <div className="card-padded" style={{ padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="search-wrapper" style={{ flex: '1 1 220px' }}>
            <Search size={14} className="search-icon-inner" />
            <input type="text" className="search-input" style={{ width: '100%' }}
              placeholder="Tìm mã GD, tên sạp, tiểu thương..."
              value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {[
          { id: 'verification', label: 'Đối soát Giao dịch', icon: Clock },
          { id: 'debts', label: 'Theo dõi Dư nợ', icon: Building },
          { id: 'disputes', label: 'Kháng nghị Hóa đơn', icon: MessageSquare }
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
          <p className="loading-text">Đang tải dữ liệu thanh toán...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: PAYMENT VERIFICATION */}
          {activeTab === 'verification' && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã Giao Dịch</th>
                    <th>Sạp / Tiểu thương</th>
                    <th>Phương thức</th>
                    <th>Ngày nộp</th>
                    <th className="text-right">Số tiền</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
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
                              <FileText size={13} /> HĐ gốc
                            </button>
                            {pay.status === 'Pending' && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => handleApprovePayment(pay)}>
                                  <ThumbsUp size={13} /> Duyệt
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={() => { setSelectedItem(pay); setRejectionNote(''); setActiveModal('reject_payment'); }}>
                                  <ThumbsDown size={13} /> Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><CheckCircle size={24} /></div><p className="empty-state-title">Không có giao dịch nào</p></div></td></tr>
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
                      Trước
                    </button>
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
                    <th>Sạp / Tiểu thương</th>
                    <th className="text-right">Nợ tiền thuê</th>
                    <th className="text-right">Nợ điện/nước</th>
                    <th className="text-right">Nợ vi phạm</th>
                    <th className="text-right">Tổng nợ</th>
                    <th>Hạn cuối</th>
                    <th className="text-right">Thao tác</th>
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
                          <button className="btn btn-secondary btn-sm" onClick={() => handleViewDebtDetail(debt)}><FileText size={13} /> Chi tiết</button>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSendReminderClick(debt)}><Bell size={13} /> Nhắc nợ</button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><DollarSign size={24} /></div><p className="empty-state-title">Không có dư nợ sạp</p></div></td></tr>
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
                      Trước
                    </button>
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
                    <th>Sạp / Tiểu thương</th>
                    <th>Nội dung kháng nghị</th>
                    <th>HĐ tháng</th>
                    <th className="text-right">Giá trị HĐ</th>
                    <th>Ngày gửi</th>
                    <th>Trạng thái</th>
                    <th className="text-right">Thao tác</th>
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
                              <button className="btn btn-success btn-sm" onClick={() => handleResolveDisputeClick(dis, true)}><ThumbsUp size={13} /> Chấp nhận</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleResolveDisputeClick(dis, false)}><ThumbsDown size={13} /> Từ chối</button>
                            </div>
                          )}
                          {dis.status !== 'Pending' && <span className="badge badge-neutral">Đã xử lý</span>}
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr><td colSpan={7}><div className="empty-state"><div className="empty-state-icon"><MessageSquare size={24} /></div><p className="empty-state-title">Không có kháng nghị nào</p></div></td></tr>
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
                      Trước
                    </button>
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
                  <div><span style={{ color: 'var(--text-muted)' }}>Sạp: </span><strong>{selectedItem.stallCode}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Tiểu thương: </span>{selectedItem.tenantName}</div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Số tiền: </span><strong style={{ color: 'var(--danger)' }}>{formatCurrency(selectedItem.amount)}</strong></div>
                  <div><span style={{ color: 'var(--text-muted)' }}>Phương thức: </span>{selectedItem.method}</div>
                </div>
                <div>
                  <label className="form-label">Lý do từ chối <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <textarea className="form-textarea" rows={4} required
                    placeholder="Ghi rõ lý do: sai số tài khoản, số tiền không khớp, hóa đơn đã được thanh toán trước đó..."
                    value={rejectionNote} onChange={e => setRejectionNote(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-danger">Xác nhận từ chối</button>
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
                  <div className="loading-spinner" /><p className="loading-text">Đang tải...</p>
                </div>
              ) : selectedInvoiceDetail && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-base)', padding: 14, borderRadius: 'var(--radius-md)', fontSize: 13.5 }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Sạp: </span><strong>{selectedInvoiceDetail.stallCode}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Tháng: </span>Th.{selectedInvoiceDetail.month}/{selectedInvoiceDetail.year}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Tiểu thương: </span>{selectedInvoiceDetail.vendorName}</div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Trạng thái: </span><span className="badge badge-warning">{selectedInvoiceDetail.status}</span></div>
                  </div>
                  <table className="data-table">
                    <thead><tr><th>Khoản phí</th><th>Mô tả</th><th className="text-right">Số lượng</th><th className="text-right">Đơn giá</th><th className="text-right">Thành tiền</th></tr></thead>
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
                        <td colSpan={4} className="text-right">Tổng cộng:</td>
                        <td className="text-right" style={{ color: 'var(--primary)', fontSize: 15 }}>{formatCurrency(selectedInvoiceDetail.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </>
              )}
            </div>
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Đóng</button></div>
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
                      <label className="form-label" style={{ marginBottom: 8 }}>Hóa đơn chưa thanh toán</label>
                      <table className="data-table">
                        <thead><tr><th>Mã HĐ</th><th>Kỳ</th><th className="text-right">Số tiền</th><th>Hạn</th><th>Trạng thái</th></tr></thead>
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
                      <label className="form-label" style={{ marginTop: 16, marginBottom: 8 }}>Vi phạm chưa đóng phạt</label>
                      <table className="data-table">
                        <thead><tr><th>Hành vi vi phạm</th><th className="text-right">Tiền phạt</th></tr></thead>
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
            <div className="modal-footer"><button className="btn btn-secondary" onClick={() => setActiveModal(null)}>Đóng</button></div>
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
                  <span style={{ fontSize: 13 }}>Tổng nợ hiện tại:</span>
                  <strong style={{ color: 'var(--danger)', fontSize: 16 }}>{formatCurrency(selectedItem.totalDebt)}</strong>
                </div>
                <div>
                  <label className="form-label">Nội dung thông báo</label>
                  <textarea className="form-textarea" rows={5} value={reminderMessage} onChange={e => setReminderMessage(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
                <button type="submit" className="btn btn-primary"><Bell size={14} /> Gửi thông báo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Dispute */}
      {activeModal === 'resolve_dispute' && selectedItem && (
        <div className="modal-overlay" onClick={() => setActiveModal(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">{disputeApprove ? 'Chấp nhận' : 'Từ chối'} Kháng nghị</span>
              <button className="modal-close-btn" onClick={() => setActiveModal(null)}><X size={16} /></button>
            </div>
            <form onSubmit={submitResolveDispute}>
              <div className="modal-body">
                <div className={`alert ${disputeApprove ? 'alert-success' : 'alert-danger'}`}>
                  <Info size={16} className="alert-icon" />
                  <div>
                    <p><strong>{selectedItem.stallCode}</strong> — {selectedItem.title}</p>
                    <p style={{ fontSize: 13, marginTop: 4, opacity: 0.9 }}>{selectedItem.description}</p>
                  </div>
                </div>
                <div>
                  <label className="form-label">Phản hồi cho tiểu thương</label>
                  <textarea className="form-textarea" rows={4} value={disputeFeedback} onChange={e => setDisputeFeedback(e.target.value)} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setActiveModal(null)}>Hủy</button>
                <button type="submit" className={`btn ${disputeApprove ? 'btn-success' : 'btn-danger'}`}>
                  {disputeApprove ? <><ThumbsUp size={14} /> Chấp nhận</> : <><ThumbsDown size={14} /> Từ chối</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
