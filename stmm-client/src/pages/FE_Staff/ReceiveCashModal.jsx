import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import readProblemDetail from '../../utils/readProblemDetail';
import './ReceiveCashModal.css';

export default function ReceiveCashModal({ stallId, stallCode, invoiceId, baseUrl, onClose, onSuccess }) {
  const { t, i18n } = useTranslation();

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
        const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`, { headers: getAuthHeaders() });
        if (!response.ok) {
          throw new Error(await readProblemDetail(response, t('receivecashmodal.unable_to_load_the')));
        }

        const data = await response.json();
        const currentInvoice = data.find(item => item.invoiceId === invoiceId);
        if (!currentInvoice) {
          throw new Error(t('receivecashmodal.the_selected_invoice_is'));
        }

        setInvoice(currentInvoice);
      } catch (err) {
        console.error(t('receivecashmodal.error_loading_the_selected'), err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSelectedInvoice();
  }, [stallId, invoiceId, baseUrl, t]);

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
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ invoiceId: invoice.invoiceId }),
      });

      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('receivecashmodal.unable_to_record_cash')));
      }

      const result = await response.json();
      onSuccess(result);
    } catch (err) {
      console.error(t('receivecashmodal.error_recording_cash_payment'), err);
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container receive-cash-modal">
        <div className="modal-header">
          <h2 className="modal-title">{t('receivecashmodal.cash_collection_stall', { stallCode })}</h2>
          <button className="modal-close-btn" onClick={onClose} disabled={submitting}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {submitError && (
            <div className="error-alert">
              <strong>{t('receivecashmodal.error')}</strong> {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">{t('receivecashmodal.current_invoice_to_collect')}</label>

            {loading ? (
              <div className="modal-loading-state">{t('receivecashmodal.loading_invoice')}</div>
            ) : error ? (
              <div className="modal-error-state">
                <span className="warning-text">Error: {error}</span>
              </div>
            ) : invoice ? (
              <div className="invoice-selection-list">
                <div className="invoice-item-card selected locked">
                  <div className="invoice-card-details">
                    <div className="invoice-card-header">
                      <span className="invoice-month-year">{t('receivecashmodal.invoice_month', { month: invoice.month, year: invoice.year })}</span>
                      <span className="invoice-amount">{invoice.totalAmount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</span>
                    </div>
                    <div className="invoice-card-body">
                      <span className="invoice-fee-summary">{t('receivecashmodal.fees')} {invoice.feeTypeSummary || t('receivecashmodal.service_fee')}</span>
                      {invoice.dueDate && (
                        <span className="invoice-due-date">
                          {t('receivecashmodal.due_date')}: {new Date(invoice.dueDate).toLocaleDateString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="modal-empty-state">{t('receivecashmodal.no_invoice_is_available')}</div>
            )}
          </div>

          {invoice && (
            <div className="payment-summary-box">
              <div className="summary-row">
                <span>{t('receivecashmodal.total_amount')}</span>
                <strong className="text-primary">{invoice.totalAmount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</strong>
              </div>
              <div className="summary-row font-sm text-muted">
                <span>{t('receivecashmodal.method')}</span>
                <span>{t('receivecashmodal.cash_100_debit_clearing')}</span>
              </div>
              <div className="summary-info-alert">
                {t('receivecashmodal.the_invoice_status_will')}<strong>{t('receivecashmodal.pending_confirmation')}</strong> {t('receivecashmodal.and_the_vendor_will')}</div>
              <label className="cash-confirmation">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  disabled={submitting}
                />
                <span>{t('receivecashmodal.i_confirm_that_i')}</span>
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
              {t('receivecashmodal.cancel')}</button>
            <button
              type="submit"
              className="btn-primary-dark"
              disabled={submitting || !invoice || !confirmed}
            >
              {submitting ? t('receivecashmodal.recording') : t('receivecashmodal.confirm_collection')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
