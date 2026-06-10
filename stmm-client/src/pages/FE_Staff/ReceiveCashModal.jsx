import React, { useState, useEffect } from 'react';
import './ReceiveCashModal.css';

export default function ReceiveCashModal({ stallId, stallCode, baseUrl, userId, onClose, onSuccess }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchUnpaidInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`);
        if (!response.ok) {
          throw new Error(`Failed to load unpaid invoices: ${response.statusText}`);
        }
        const data = await response.json();
        setInvoices(data);
        if (data.length > 0) {
          setSelectedInvoiceId(data[0].invoiceId); // Default select the first one
        }
      } catch (err) {
        console.error("Error loading unpaid invoices:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUnpaidInvoices();
  }, [stallId, baseUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/payments/cash?userId=${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: selectedInvoiceId }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to record payment: ${response.statusText}`);
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      console.error("Error recording cash payment:", err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedInvoice = invoices.find(i => i.invoiceId === selectedInvoiceId);

  return (
    <div className="modal-overlay">
      <div className="modal-container receive-cash-modal">
        <div className="modal-header">
          <h2 className="modal-title">💰 Thu tiền mặt - Sạp {stallCode}</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Lỗi:</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">CHỌN HÓA ĐƠN CẦN THU</label>

            {loading ? (
              <div className="modal-loading-state">Đang tải hóa đơn...</div>
            ) : error ? (
              <div className="modal-error-state">
                <span className="warning-text">⚠️ Lỗi: {error}</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="modal-empty-state">
                🎉 Không có hóa đơn chưa thanh toán nào cho sạp {stallCode}.
              </div>
            ) : (
              <div className="invoice-selection-list">
                {invoices.map((invoice) => (
                  <label 
                    key={invoice.invoiceId} 
                    className={`invoice-item-card ${selectedInvoiceId === invoice.invoiceId ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="selectedInvoice"
                      checked={selectedInvoiceId === invoice.invoiceId}
                      onChange={() => setSelectedInvoiceId(invoice.invoiceId)}
                      disabled={submitting}
                      className="invoice-radio"
                    />
                    <div className="invoice-card-details">
                      <div className="invoice-card-header">
                        <span className="invoice-month-year">Hóa đơn Tháng {invoice.month}/{invoice.year}</span>
                        <span className="invoice-amount">{invoice.totalAmount.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="invoice-card-body">
                        <span className="invoice-fee-summary">Phí: {invoice.feeTypeSummary || 'Chi phí dịch vụ'}</span>
                        {invoice.dueDate && (
                          <span className="invoice-due-date">Hạn đóng: {new Date(invoice.dueDate).toLocaleDateString('vi-VN')}</span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedInvoice && (
            <div className="payment-summary-box">
              <div className="summary-row">
                <span>Tổng tiền thu:</span>
                <strong className="text-primary">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="summary-row font-sm text-muted">
                <span>Phương thức:</span>
                <span>Tiền mặt (gạch nợ 100%)</span>
              </div>
              <div className="summary-info-alert">
                ℹ️ Hóa đơn sau khi thu sẽ chuyển sang trạng thái <strong>Chờ đối soát</strong> và gửi thông báo tới Tiểu thương.
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              HỦY BỎ
            </button>
            <button
              type="submit"
              className="btn-primary-dark"
              disabled={submitting || !selectedInvoiceId || invoices.length === 0}
            >
              {submitting ? "ĐANG GHI NHẬN..." : "XÁC NHẬN THU TIỀN"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
