import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';
import { getAuthHeaders } from '../../utils/authHeaders';
import ReceiveCashModal from './ReceiveCashModal';
import readProblemDetail from '../../utils/readProblemDetail';
import './StallInvoiceDetail.css';

const INVOICE_STATUS = Object.freeze({ UNPAID: 'Unpaid' });

export default function StallInvoiceDetail({ stallId, stallCode, baseUrl, onBack, onShowNotification }) {
  const { t, i18n } = useTranslation();

  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [listError, setListError] = useState(null);
  const [detailError, setDetailError] = useState(null);

  const [showCashModal, setShowCashModal] = useState(false);

  const fetchUnpaidInvoices = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('stallinvoicedetail.unable_to_load_unpaid')));
      }
      const data = await response.json();
      setUnpaidInvoices(data);
      if (data.length > 0) {
        setSelectedInvoiceId(data[0].invoiceId);
      } else {
        setSelectedInvoiceId(null);
        setInvoiceDetail(null);
      }
    } catch (err) {
      console.error(t('stallinvoicedetail.error_loading_unpaid_invoices'), err);
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  }, [baseUrl, stallId, t]);

  const fetchInvoiceDetail = useCallback(async (invoiceId) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/${invoiceId}`, { headers: getAuthHeaders() });
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, t('stallinvoicedetail.unable_to_load_invoice')));
      }
      const data = await response.json();
      setInvoiceDetail(data);
    } catch (err) {
      console.error(t('stallinvoicedetail.error_loading_invoice_detail'), err);
      setDetailError(err.message);
      setInvoiceDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [baseUrl, t]);

  useEffect(() => {
    fetchUnpaidInvoices();
  }, [fetchUnpaidInvoices]);

  useEffect(() => {
    if (selectedInvoiceId) {
      fetchInvoiceDetail(selectedInvoiceId);
    }
  }, [fetchInvoiceDetail, selectedInvoiceId]);

  const handlePaymentSuccess = (result) => {
    setShowCashModal(false);
    onShowNotification(
      `${t('stallinvoicedetail.payment_recorded_successfully')} ${result.amount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND`,
      'success'
    );
    fetchUnpaidInvoices();
  };

  const formatDate = (dateString) => {
    if (!dateString) return t('stallinvoicedetail.na');
    return new Date(dateString).toLocaleDateString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US');
  };

  return (
    <div className="stall-invoice-detail-page">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>📄 INVOICES - STALL {stallCode}</h2>
        <button className="btn-secondary-outline" onClick={onBack}>
          &larr; {t('stallinvoicedetail.back')}
        </button>
      </div>

      <div className="invoice-split-layout">
        <div className="invoice-list-column">
          <h3 className="column-title">{t('stallinvoicedetail.unpaid_invoices_count', { count: unpaidInvoices.length })}</h3>

          {loadingList ? (
            <div className="loading-state">{t('stallinvoicedetail.loading_invoices')}</div>
          ) : listError ? (
            <div className="error-state">
              <span className="warning-text">⚠️ Error: {listError}</span>
              <button className="btn-secondary font-sm mt-2" onClick={fetchUnpaidInvoices}>{t('stallinvoicedetail.retry')}</button>
            </div>
          ) : unpaidInvoices.length === 0 ? (
            <div className="invoice-empty-notice">
              🎉 This stall has paid all invoices. No outstanding balance.
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
                    <span className="inv-label">Month {inv.month}/{inv.year}</span>
                    <span className="inv-amount">{inv.totalAmount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</span>
                  </div>
                  <div className="inv-summary-body">
                    <span className="inv-fees text-truncate">{inv.feeTypeSummary}</span>
                    {inv.dueDate && (
                      <span className="inv-due text-danger">Due: {formatDate(inv.dueDate)}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="invoice-detail-column">
          {selectedInvoiceId ? (
            loadingDetail ? (
              <div className="loading-state">{t('stallinvoicedetail.loading_invoice_details')}</div>
            ) : detailError ? (
              <div className="error-state">Error loading details: {detailError}</div>
            ) : invoiceDetail ? (
              <div className="invoice-detail-box">
                <div className="detail-header-section">
                  <div className="header-meta">
                    <h2 className="invoice-title">{t('stallinvoicedetail.invoice_month', { month: invoiceDetail.month, year: invoiceDetail.year })}</h2>
                    <span className={`status-badge ${invoiceDetail.status.toLowerCase().replace(' ', '-')}`}>
                      {invoiceDetail.status === INVOICE_STATUS.UNPAID ? t('stallinvoicedetail.unpaid') : invoiceDetail.status}
                    </span>
                  </div>
                  <div className="header-total">
                    <span className="total-label">{t('stallinvoicedetail.total_amount')}</span>
                    <h1 className="total-val">{invoiceDetail.totalAmount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')} VND</h1>
                  </div>
                </div>

                <hr className="detail-divider" />

                <div className="invoice-relations-info">
                  <div className="relation-col">
                    <span className="info-label">{t('stallinvoicedetail.vendor_name')}</span>
                    <span className="info-value">{invoiceDetail.vendorName}</span>
                    <span className="info-sub">{invoiceDetail.vendorPhone}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">{t('stallinvoicedetail.associated_stall')}</span>
                    <span className="info-value">{invoiceDetail.stallCode}</span>
                      <span className="info-sub">{t('stallinvoicedetail.category')} {invoiceDetail.stallCategory || t('stallinvoicedetail.na')}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">{t('stallinvoicedetail.due_date')}</span>
                    <span className="info-value text-danger">{formatDate(invoiceDetail.dueDate)}</span>
                    <span className="info-sub">{t('stallinvoicedetail.issued_date')} {formatDate(invoiceDetail.createdAt)}</span>
                  </div>
                </div>

                <div className="fee-breakdown-section">
                  <h4 className="section-title">{t('stallinvoicedetail.fees_breakdown')}</h4>
                  <table className="fees-table">
                    <thead>
                      <tr>
                        <th>{t('stallinvoicedetail.fee_name')}</th>
                        <th>{t('stallinvoicedetail.description')}</th>
                        <th className="text-right">{t('stallinvoicedetail.qty')}</th>
                        <th className="text-right">{t('stallinvoicedetail.unit_price_vnd')}</th>
                        <th className="text-right">{t('stallinvoicedetail.amount_vnd')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceDetail.details.map((detail) => (
                        <tr key={detail.invoiceDetailId}>
                          <td><strong>{detail.feeTypeName}</strong></td>
                          <td className="text-muted text-sm">{detail.description || '-'}</td>
                          <td className="text-right">{detail.quantity}</td>
                          <td className="text-right">{detail.unitPrice.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')}</td>
                          <td className="text-right font-semibold">{detail.amount.toLocaleString(i18n.resolvedLanguage?.startsWith('vi') ? 'vi-VN' : 'en-US')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {invoiceDetail.status === INVOICE_STATUS.UNPAID && (
                  <div className="invoice-action-panel">
                    <div className="action-text">
                      <span className="info-icon">💡</span>
                      <p>{t('stallinvoicedetail.are_you_collecting_cash')}</p>
                    </div>
                    <button 
                      className="btn-primary-dark action-pay-btn"
                      onClick={() => setShowCashModal(true)}
                    >
                      💰 COLLECT CASH
                    </button>
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="invoice-select-prompt">
              👈 Select an invoice from the left column to view the details breakdown.
            </div>
          )}
        </div>
      </div>

      {showCashModal && (
        <ReceiveCashModal
          stallId={stallId}
          stallCode={stallCode}
          invoiceId={selectedInvoiceId}
          baseUrl={baseUrl}
          onClose={() => setShowCashModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
