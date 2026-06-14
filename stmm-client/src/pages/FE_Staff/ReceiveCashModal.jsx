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
          <h2 className="modal-title">💰 Cash Collection - Stall {stallCode}</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">SELECT INVOICE TO COLLECT</label>

            {loading ? (
              <div className="modal-loading-state">Loading invoices...</div>
            ) : error ? (
              <div className="modal-error-state">
                <span className="warning-text">⚠️ Error: {error}</span>
              </div>
            ) : invoices.length === 0 ? (
              <div className="modal-empty-state">
                🎉 No unpaid invoices for stall {stallCode}.
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
                        <span className="invoice-month-year">Invoice Month {invoice.month}/{invoice.year}</span>
                        <span className="invoice-amount">{invoice.totalAmount.toLocaleString('vi-VN')} VND</span>
                      </div>
                      <div className="invoice-card-body">
                        <span className="invoice-fee-summary">Fees: {invoice.feeTypeSummary || 'Service Fee'}</span>
                        {invoice.dueDate && (
                          <span className="invoice-due-date">Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-US')}</span>
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
                <span>Total Amount:</span>
                <strong className="text-primary">{selectedInvoice.totalAmount.toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="summary-row font-sm text-muted">
                <span>Method:</span>
                <span>Cash (100% debit clearing)</span>
              </div>
              <div className="summary-info-alert">
                ℹ️ Collected invoice status will be updated to <strong>Pending Reconciliation</strong> and a notification will be sent to the Vendor.
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
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary-dark"
              disabled={submitting || !selectedInvoiceId || invoices.length === 0}
            >
              {submitting ? "Recording..." : "Confirm Collection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
