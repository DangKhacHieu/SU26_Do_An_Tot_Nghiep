import { useState, useEffect } from 'react';
import readProblemDetail from '../../utils/readProblemDetail';
import './ReceiveCashModal.css';

export default function ReceiveCashModal({ stallId, stallCode, invoiceId, baseUrl, onClose, onSuccess }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    const fetchSelectedInvoice = async () => {
      setLoading(true);
      setError(null);
      setInvoice(null);
      setConfirmed(false);

      try {
        const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`);
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, 'Unable to load the selected invoice.'));
        }

        const data = await response.json();
        const currentInvoice = data.find(item => item.invoiceId === invoiceId);
        if (!currentInvoice) {
          throw new Error('The selected invoice is no longer unpaid or is unavailable.');
        }

        setInvoice(currentInvoice);
      } catch (err) {
        console.error('Error loading the selected invoice:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedInvoice();
  }, [stallId, invoiceId, baseUrl]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!invoice || !confirmed) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/payments/cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoiceId: invoice.invoiceId }),
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to record cash payment.'));
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      console.error('Error recording cash payment:', err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container receive-cash-modal">
        <div className="modal-header">
          <h2 className="modal-title">Cash Collection - Stall {stallCode}</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>Error:</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">CURRENT INVOICE TO COLLECT</label>

            {loading ? (
              <div className="modal-loading-state">Loading invoice...</div>
            ) : error ? (
              <div className="modal-error-state">
                <span className="warning-text">Error: {error}</span>
              </div>
            ) : invoice ? (
              <div className="invoice-selection-list">
                <div className="invoice-item-card selected locked">
                  <div className="invoice-card-details">
                    <div className="invoice-card-header">
                      <span className="invoice-month-year">Invoice Month {invoice.month}/{invoice.year}</span>
                      <span className="invoice-amount">{invoice.totalAmount.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <div className="invoice-card-body">
                      <span className="invoice-fee-summary">Fees: {invoice.feeTypeSummary || 'Service Fee'}</span>
                      {invoice.dueDate && (
                        <span className="invoice-due-date">
                          Due Date: {new Date(invoice.dueDate).toLocaleDateString('en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="modal-empty-state">No invoice is available for collection.</div>
            )}
          </div>

          {invoice && (
            <div className="payment-summary-box">
              <div className="summary-row">
                <span>Total Amount:</span>
                <strong className="text-primary">{invoice.totalAmount.toLocaleString('vi-VN')} VND</strong>
              </div>
              <div className="summary-row font-sm text-muted">
                <span>Method:</span>
                <span>Cash (100% debit clearing)</span>
              </div>
              <div className="summary-info-alert">
                The invoice status will be updated to <strong>Pending Confirmation</strong> and the Vendor will be notified.
              </div>
              <label className="cash-confirmation">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={submitting}
                />
                <span>I confirm that I received the full cash amount shown above.</span>
              </label>
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
              disabled={submitting || !invoice || !confirmed}
            >
              {submitting ? 'Recording...' : 'Confirm Collection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
