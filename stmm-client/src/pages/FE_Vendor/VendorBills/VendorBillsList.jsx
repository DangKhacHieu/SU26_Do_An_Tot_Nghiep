import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { vendorInvoiceApi } from '../../../services/vendorInvoiceApi';
import VendorRequestCreate from '../VendorRequests/VendorRequestCreate';

import { showError } from '../../../utils/alert';

import { paymentApi } from '../../../services/paymentApi';

import './VendorBillsList.css';

export default function VendorBillsList({ vendorId, stallId }) {
  const { t } = useTranslation();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);

    // Modal state
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Disputing state
    const [isDisputing, setIsDisputing] = useState(false);
    const [disputeInvoiceId, setDisputeInvoiceId] = useState(null);
    const [disputeStallId, setDisputeStallId] = useState(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchInvoices();
    }, [stallId, pageNumber]); // Fetch when stallId or pageNumber changes

    const fetchInvoices = async () => {
        if (!vendorId) return;
        setLoading(true);
        try {
            const data = await vendorInvoiceApi.getVendorInvoices(
                stallId,
                month ? parseInt(month) : null,
                year ? parseInt(year) : null,
                pageNumber,
                pageSize
            );
            if (data && data.items) {
                setInvoices(data.items);
                setTotalPages(Math.ceil(data.totalCount / data.pageSize));
                setTotalCount(data.totalCount);
            } else {
                setInvoices(data || []);
                setTotalPages(1);
                setTotalCount((data || []).length);
            }
        } catch (err) {
            console.error(t('vendorbillslist.error_loading_invoice'), err);
            showError(t('vendorbillslist.failure'), t('vendorbillslist.an_error_occurred_while'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        if (pageNumber === 1) {
            fetchInvoices();
        } else {
            setPageNumber(1); // Will trigger useEffect
        }
    };

    const handlePayment = async (invoiceId, requestType) => {
        try {
            setLoading(true);
            const { payUrl } = await paymentApi.createMomoPayment(invoiceId, requestType);
            if (payUrl) {
                window.location.href = payUrl; // Chuyển hướng sang MoMo
            }
        } catch (err) {
            console.error(t('vendorbillslist.error_initiating_momo_payment'), err);
            const errorMsg = err.response?.data?.message || err.message;
            alert('Đã xảy ra lỗi khi tạo yêu cầu thanh toán MoMo: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    const getStatusBadge = (status) => {
        switch (status?.toLowerCase()) {
            case 'paid':
                return <span className="bill-badge badge-success">{t('vendorbillslist.paid')}</span>;
            case 'unpaid':
                return <span className="bill-badge badge-warning">{t('vendorbillslist.not_yet_paid')}</span>;
            case 'overdue':
                return <span className="bill-badge badge-danger">{t('vendorbillslist.overdue')}</span>;
            default:
                return <span className="bill-badge badge-secondary">{status}</span>;
        }
    };

    if (isDisputing) {
        return <VendorRequestCreate 
            onBack={() => setIsDisputing(false)} 
            onSuccess={() => { setIsDisputing(false); fetchInvoices(); }} 
            prefillInvoiceId={disputeInvoiceId}
            prefillStallId={disputeStallId}
        />;
    }

    return (
        <div className="vendor-bills-container fade-in">
            <div className="bills-header">
                <h2>{t('vendorbillslist.utility_bills')}</h2>
                <p>{t('vendorbillslist.view_a_list_of')}</p>
            </div>

            <div className="bills-filters">
                <div className="filter-group">
                    <label>{t('vendorbillslist.month')}</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="">{t('vendorbillslist.all')}</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>{t('vendorbillslist.year')}</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">{t('vendorbillslist.all')}</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <button className="btn-search" onClick={handleSearch} disabled={loading}>
                    {loading ? t('vendorbillslist.looking_for') : t('vendorbillslist.search')}
                </button>
            </div>

            <div className="bills-content">
                {loading ? (
                    <div className="loading-state">{t('vendorbillslist.loading_data')}</div>
                ) : invoices.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <p>{t('vendorbillslist.there_are_no_invoices')}</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>{t('vendorbillslist.fall_semester_monthyear')}</th>
                                    <th>{t('vendorbillslist.total_amount_vnd')}</th>
                                    <th>{t('vendorbillslist.due_date')}</th>
                                    <th>{t('vendorbillslist.trng_thi_status')}</th>
                                    <th style={{ textAlign: 'center' }}>{t('vendorbillslist.operation')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv, index) => (
                                    <tr key={inv.invoiceId}>
                                        <td><strong>#{index + 1}</strong></td>
                                        <td>{inv.month}/{inv.year}</td>
                                        <td className="amount-col">{formatCurrency(inv.totalAmount)}</td>
                                        <td>{inv.dueDate || '-'}</td>
                                        <td>{getStatusBadge(inv.status)}</td>
                                        <td style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button 
                                                className="btn-view"
                                                onClick={() => setSelectedInvoice(inv)}
                                                title={t('vendorbillslist.view_invoice_details')}
                                            >
                                                {t('vendorbillslist.see_details')}
                                            </button>
                                            <button 
                                                className={`btn-pay ${inv.status?.toLowerCase() === 'paid' ? 'disabled' : ''}`}
                                                disabled={inv.status?.toLowerCase() === 'paid'}
                                                onClick={() => setSelectedInvoice(inv)}
                                                title={inv.status?.toLowerCase() === 'paid' ? t('vendorbillslist.invoice_paid') : t('vendorbillslist.online_payment')}
                                            >
                                                {t('vendorbillslist.pay')}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {!loading && invoices.length > 0 && totalPages > 1 && (
                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px', alignItems: 'center' }}>
                        <button 
                            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
                            disabled={pageNumber <= 1}
                            onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                        >
                            {t('vendorbillslist.previous_page')}
                        </button>
                        <span style={{ fontSize: '14px', color: '#475569' }}>Trang {pageNumber} / {totalPages}</span>
                        <button 
                            style={{ padding: '8px 16px', border: '1px solid #cbd5e1', borderRadius: '4px', background: '#fff', cursor: 'pointer' }}
                            disabled={pageNumber >= totalPages}
                            onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                        >
                            Trang sau
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Chi tiết Hóa đơn */}
            {selectedInvoice && (
                <div className="bill-modal-overlay" onClick={() => setSelectedInvoice(null)}>
                    <div className="bill-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="bill-modal-header">
                            <h3>Chi tiết hóa đơn - Kỳ {selectedInvoice.month}/{selectedInvoice.year}</h3>
                            <button className="btn-close-modal" onClick={() => setSelectedInvoice(null)}>&times;</button>
                        </div>
                        <div className="bill-modal-body">
                            <div className="bill-info-grid">
                                <div><strong>{t('vendorbillslist.store_code')}</strong> {selectedInvoice.stallCode}</div>
                                <div><strong>{t('vendorbillslist.deadline')}</strong> {selectedInvoice.dueDate || '-'}</div>
                                <div><strong>{t('vendorbillslist.status')}</strong> {getStatusBadge(selectedInvoice.status)}</div>
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#334155' }}>{t('vendorbillslist.revenues')}</h4>
                            <table className="bills-details-table">
                                <thead>
                                    <tr>
                                        <th>{t('vendorbillslist.fee_type')}</th>
                                        <th>{t('vendorbillslist.describe')}</th>
                                        <th style={{ textAlign: 'right' }}>{t('vendorbillslist.index_quantity')}</th>
                                        <th style={{ textAlign: 'right' }}>{t('vendorbillslist.make_money')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedInvoice.details?.map(d => (
                                        <tr key={d.invoiceDetailId}>
                                            <td>{d.feeTypeName}</td>
                                            <td>{d.description || '-'}</td>
                                            <td style={{ textAlign: 'right' }}>{d.quantity}</td>
                                            <td style={{ textAlign: 'right', fontWeight: '500' }}>{formatCurrency(d.amount)}</td>
                                        </tr>
                                    ))}
                                    <tr className="total-row">
                                        <td colSpan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>TỔNG CỘNG</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#0f172a' }}>
                                            {formatCurrency(selectedInvoice.totalAmount)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="bill-modal-footer">
                            <button 
                                className="btn-cancel" 
                                style={{ backgroundColor: '#f59e0b', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginRight: 'auto' }}
                                onClick={() => {
                                    setDisputeInvoiceId(selectedInvoice.invoiceId);
                                    setDisputeStallId(selectedInvoice.stallId);
                                    setIsDisputing(true);
                                    setSelectedInvoice(null);
                                }}>
                                Khiếu nại hóa đơn
                            </button>
                            {selectedInvoice.status?.toLowerCase() !== 'paid' && (
                                <div className="payment-options" style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn-pay-momo" 
                                        style={{ backgroundColor: '#a50064', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handlePayment(selectedInvoice.invoiceId, 'captureWallet')}>
                                        {t('vendorbillslist.scan_the_momo_qr')}
                                    </button>
                                    <button 
                                        className="btn-pay-atm" 
                                        style={{ backgroundColor: '#334155', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handlePayment(selectedInvoice.invoiceId, 'payWithATM')}>
                                        {t('vendorbillslist.atm_card_payment')}
                                    </button>
                                </div>
                            )}
                            <button className="btn-cancel" onClick={() => setSelectedInvoice(null)}>{t('vendorbillslist.close')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
