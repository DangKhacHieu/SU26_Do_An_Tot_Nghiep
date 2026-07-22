import { useState, useEffect, useCallback } from 'react';
import ReceiveCashModal from './ReceiveCashModal';
import readProblemDetail from '../../utils/readProblemDetail';
import './StallInvoiceDetail.css';

export default function StallInvoiceDetail({ stallId, stallCode, baseUrl, onBack, onShowNotification }) {
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
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/stall/${stallId}/unpaid`);
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to load unpaid invoices.'));
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
      console.error("Error loading unpaid invoices:", err);
      setListError(err.message);
    } finally {
      setLoadingList(false);
    }
  }, [baseUrl, stallId]);

  const fetchInvoiceDetail = useCallback(async (invoiceId) => {
    setLoadingDetail(true);
    setDetailError(null);
    try {
      const response = await fetch(`${baseUrl}/api/staff/billing/invoices/${invoiceId}`);
      if (!response.ok) {
        throw new Error(await readProblemDetail(response, 'Unable to load invoice details.'));
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
  }, [baseUrl]);

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
      `Invoice payment recorded successfully. Amount: ${result.amount.toLocaleString('vi-VN')} VND`, 
      'success'
    );
    fetchUnpaidInvoices();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <div className="stall-invoice-detail-page">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>📄 INVOICES - STALL {stallCode}</h2>
        <button className="btn-secondary-outline" onClick={onBack}>
          &larr; Back
        </button>
      </div>

      <div className="invoice-split-layout">
        <div className="invoice-list-column">
          <h3 className="column-title">Unpaid Invoices ({unpaidInvoices.length})</h3>

          {loadingList ? (
            <div className="loading-state">Loading invoices...</div>
          ) : listError ? (
            <div className="error-state">
              <span className="warning-text">⚠️ Error: {listError}</span>
              <button className="btn-secondary font-sm mt-2" onClick={fetchUnpaidInvoices}>Retry</button>
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
                    <span className="inv-amount">{inv.totalAmount.toLocaleString('vi-VN')} VND</span>
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
              <div className="loading-state">Loading invoice details...</div>
            ) : detailError ? (
              <div className="error-state">Error loading details: {detailError}</div>
            ) : invoiceDetail ? (
              <div className="invoice-detail-box">
                <div className="detail-header-section">
                  <div className="header-meta">
                    <h2 className="invoice-title">Invoice Month {invoiceDetail.month}/{invoiceDetail.year}</h2>
                    <span className={`status-badge ${invoiceDetail.status.toLowerCase().replace(' ', '-')}`}>
                      {invoiceDetail.status === 'Unpaid' ? 'Unpaid' : invoiceDetail.status}
                    </span>
                  </div>
                  <div className="header-total">
                    <span className="total-label">Total Amount</span>
                    <h1 className="total-val">{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VND</h1>
                  </div>
                </div>

                <hr className="detail-divider" />

                <div className="invoice-relations-info">
                  <div className="relation-col">
                    <span className="info-label">Vendor Name</span>
                    <span className="info-value">{invoiceDetail.vendorName}</span>
                    <span className="info-sub">{invoiceDetail.vendorPhone}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">Associated Stall</span>
                    <span className="info-value">{invoiceDetail.stallCode}</span>
                    <span className="info-sub">Category: {invoiceDetail.stallCategory || 'N/A'}</span>
                  </div>
                  <div className="relation-col">
                    <span className="info-label">Due Date</span>
                    <span className="info-value text-danger">{formatDate(invoiceDetail.dueDate)}</span>
                    <span className="info-sub">Issued Date: {formatDate(invoiceDetail.createdAt)}</span>
                  </div>
                </div>

                <div className="fee-breakdown-section">
                  <h4 className="section-title">Fees Breakdown</h4>
                  <table className="fees-table">
                    <thead>
                      <tr>
                        <th>Fee Name</th>
                        <th>Description</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit Price (VND)</th>
                        <th className="text-right">Amount (VND)</th>
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

                {invoiceDetail.status === 'Unpaid' && (
                  <div className="invoice-action-panel">
                    <div className="action-text">
                      <span className="info-icon">💡</span>
                      <p>Are you collecting cash directly from the vendor on-site? Click the button on the right to record this payment.</p>
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
