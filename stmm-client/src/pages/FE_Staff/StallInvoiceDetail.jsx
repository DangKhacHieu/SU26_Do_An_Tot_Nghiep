import React, { useState, useEffect } from 'react';
import ReceiveCashModal from './ReceiveCashModal';
import './StallInvoiceDetail.css';

export default function StallInvoiceDetail({ stallId, stallCode, baseUrl, userId, onBack, onShowNotification }) {
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError] = useState(null);
  const [detailError, setDetailError] = useState(null);

  // Modal cash collection state
  const [showCashModal, setShowCashModal] = useState(false);

  const fetchUnpaidInvoices = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`);
      if (!response.ok) {
        throw new Error(`Failed to load unpaid invoices: ${response.statusText}`);
      }
      const data = await response.json();
      setUnpaidInvoices(data);
      if (data.length > 0) {
        // Automatically select the first invoice if none is selected
        setSelectedInvoiceId(data[0].invoiceId);
      } else {
        setSelectedInvoiceId(null);
        setInvoiceDetail(null);
      }
    } catch (err) {
      console.error("Error loading unpaid invoices:", err);
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchInvoiceDetail = async (invoiceId) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error(`Failed to load invoice details: ${response.statusText}`);
      }
      const data = await response.json();
      setInvoiceDetail(data);
    } catch (err) {
      console.error("Error loading invoice detail:", err);
      setDetailError(err.message);
      setInvoiceDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchUnpaidInvoices();
  }, [stallId, baseUrl]);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetail(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const handlePaymentSuccess = (result) => {
    setShowCashModal(false);
    onShowNotification(
      `Đã thu tiền mặt hóa đơn thành công. Số tiền: ${result.amount.toLocaleString('vi-VN')} VND`, 
      'success'
    );
    fetchUnpaidInvoices(); // Reload the unpaid invoices list
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="stall-invoice-detail-page">
      <div className="breadcrumb-path">
        <span>Dashboard</span> &gt; <span>Stalls Checklist</span> &gt; <span className="active-path">Chi tiết Hóa đơn</span>
      </div>

      <div className="section-header">
        <div>
          <h1 className="main-title">📄 Danh sách Hóa đơn - Sạp {stallCode}</h1>
          <p className="subtitle">Xem chi tiết các khoản phí dịch vụ và thu tiền mặt.</p>
        </div>
        <button className="btn-secondary-outline" onClick={onBack}>
          &larr; Quay lại
        </button>
      </div>

      <div className="invoice-split-layout">
        {/* Left column: List of Invoices */}
        <div className="invoice-list-column">
          <h3 className="column-title">Hóa đơn chưa thanh toán ({unpaidInvoices.length})</h3>

          {loadingList ? (
            <div className="loading-state">Đang tải danh sách hóa đơn...</div>
          ) : listError ? (
            <div className="error-state">
              <span className="warning-text">⚠️ Lỗi: {listError}</span>
              <button className="btn-secondary font-sm mt-2" onClick={fetchUnpaidInvoices}>Thử lại</button>
            </div>
          ) : unpaidInvoices.length === 0 ? (
            <div className="invoice-empty-notice">
              🎉 Sạp này đã thanh toán đầy đủ hóa đơn, không có công nợ tồn đọng.
            </div>
          ) : (
            <div className="unpaid-invoices-scroll">
              {unpaidInvoices.map((inv) => (
                <div 
                  key={inv.invoiceId}
                  className={`invoice-summary-card ${selectedInvoiceId === inv.invoiceId ? 'active' : ''}`}
                  onClick={() => setSelectedInvoiceId(inv.invoiceId)}
                >
                  <div className="inv-summary-header">
                    <span className="inv-label">Tháng {inv.month}/{inv.year}</span>
                    <span className="inv-amount">{inv.totalAmount.toLocaleString('vi-VN')} VND</span>
                  </div>
                  <div className="inv-summary-body">
                    <span className="inv-fees text-truncate">{inv.feeTypeSummary}</span>
                    {inv.dueDate && (
                      <span className="inv-due text-danger">Hạn: {formatDate(inv.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: Invoice Details */}
        <div className="invoice-detail-column">
          {selectedInvoiceId ? (
            loadingDetail ? (
              <div className="loading-state">Đang tải chi tiết hóa đơn...</div>
            ) : detailError ? (
              <div className="error-state">Lỗi tải chi tiết: {detailError}</div>
            ) : invoiceDetail ? (
              <div className="invoice-detail-box">
                <div className="detail-header-section">
                  <div className="header-meta">
                    <h2 className="invoice-title">Hóa đơn Tháng {invoiceDetail.month}/{invoiceDetail.year}</h2>
                    <span className={`status-badge ${invoiceDetail.status.toLowerCase().replace(' ', '-')}`}>
                      {invoiceDetail.status === 'Unpaid' ? 'Chưa thanh toán' : invoiceDetail.status}
                    </span>
                  </div>
                  <div className="header-total">
                    <span className="total-label">Tổng tiền</span>
                    <h1 className="total-val">{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VND</h1>
                  </div>
                </div>

                <hr className="detail-divider" />

                {/* Vendor & Stall info */}
                <div className="invoice-relations-info">
                  <div className="relation-col">
                    <span className="info-label">Chủ hộ kinh doanh</span>
                    <span className="info-value">{invoiceDetail.vendorName}</span>
                    <span className="info-sub">{invoiceDetail.vendorPhone}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">Sạp liên đới</span>
                    <span className="info-value">{invoiceDetail.stallCode}</span>
                    <span className="info-sub">Danh mục: {invoiceDetail.stallCategory || 'N/A'}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">Hạn thanh toán</span>
                    <span className="info-value text-danger">{formatDate(invoiceDetail.dueDate)}</span>
                    <span className="info-sub">Ngày lập: {formatDate(invoiceDetail.createdAt)}</span>
                  </div>
                </div>

                <div className="fee-breakdown-section">
                  <h4 className="section-title">Chi tiết các khoản phí</h4>
                  <table className="fees-table">
                    <thead>
                      <tr>
                        <th>Tên khoản phí</th>
                        <th>Mô tả</th>
                        <th className="text-right">Số lượng</th>
                        <th className="text-right">Đơn giá (VND)</th>
                        <th className="text-right">Thành tiền (VND)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetail.details.map((detail) => (
                        <tr key={detail.invoiceDetailId}>
                          <td><strong>{detail.feeTypeName}</strong></td>
                          <td className="text-muted text-sm">{detail.description || '-'}</td>
                          <td className="text-right">{detail.quantity}</td>
                          <td className="text-right">{detail.unitPrice.toLocaleString('vi-VN')}</td>
                          <td className="text-right font-semibold">{detail.amount.toLocaleString('vi-VN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Action panel */}
                {invoiceDetail.status === 'Unpaid' && (
                  <div className="invoice-action-panel">
                    <div className="action-text">
                      <span className="info-icon">💡</span>
                      <p>Bạn đang đi tuần tại hiện trường và thu tiền mặt trực tiếp từ Tiểu thương? Nhấn nút bên phải để ghi nhận gạch nợ.</p>
                    </div>
                    <button 
                      className="btn-primary-dark action-pay-btn"
                      onClick={() => setShowCashModal(true)}
                    >
                      💰 THU TIỀN MẶT
                    </button>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="invoice-select-prompt">
              👈 Hãy chọn một hóa đơn từ cột bên trái để xem bảng phân tích chi tiết.
            </div>
          )}
        </div>
      </div>

      {/* Cash Collection Modal popup */}
      {showCashModal && (
        <ReceiveCashModal
          stallId={stallId}
          stallCode={stallCode}
          baseUrl={baseUrl}
          userId={userId}
          onClose={() => setShowCashModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
