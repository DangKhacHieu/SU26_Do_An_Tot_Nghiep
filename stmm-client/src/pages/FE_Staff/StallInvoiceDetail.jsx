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
    document.title = "Stall Invoices - STMM Staff";
  }, []);

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
      `Invoice payment recorded successfully. Amount: ${result.amount.toLocaleString('vi-VN')} VND`, 
      'success'
    );
    fetchUnpaidInvoices(); // Reload the unpaid invoices list
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US');
  };

  return (
    <main className="stall-invoice-detail-page">
      <div className="details-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--text-main)' }}>📄 INVOICES - STALL {stallCode}</h1>
        <button id="invoice-back-btn" className="btn-secondary-outline" onClick={onBack}>
          &larr; Back
        </button>
      </div>

      <div className="invoice-split-layout">
        {/* Left column: List of Invoices */}
        <div className="invoice-list-column">
          <h3 className="column-title">Unpaid Invoices ({unpaidInvoices.length})</h3>

          {loadingList ? (
            <div className="loading-state">
              <span className="spinner" aria-hidden="true"></span>
              <p>Loading invoices...</p>
            </div>
          ) : listError ? (
            <div className="error-state">
              <span className="error-icon" aria-hidden="true">⚠️</span>
              <p className="error-message">Error: {listError}</p>
              <button id="invoice-retry-btn" className="btn-secondary" onClick={fetchUnpaidInvoices}>Retry</button>
            </div>
          ) : unpaidInvoices.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon" aria-hidden="true">🎉</span>
              <h2>No Invoices Found</h2>
              <p>This stall has paid all invoices. No outstanding balance.</p>
            </div>
          ) : (
            <div className="unpaid-invoices-scroll">
              {unpaidInvoices.map((inv) => (
                <div 
                  id={`invoice-summary-card-${inv.invoiceId}`}
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

        {/* Right column: Invoice Details */}
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
                    <h2 className="total-val" style={{ margin: 0 }}>{invoiceDetail.totalAmount.toLocaleString('vi-VN')} VND</h2>
                  </div>
                </div>

                <hr className="detail-divider" />

                {/* Vendor & Stall info */}
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

                {/* Action panel */}
                {invoiceDetail.status === 'Unpaid' && (
                  <div className="invoice-action-panel">
                    <div className="action-text">
                      <span className="info-icon">💡</span>
                      <p>Are you collecting cash directly from the vendor on-site? Click the button on the right to record this payment.</p>
                    </div>
                    <button 
                      id="collect-cash-btn"
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
    </main>
  );
}
