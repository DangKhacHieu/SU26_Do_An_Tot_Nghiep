import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import { vendorInvoiceApi } from '../../../services/vendorInvoiceApi';
import VendorRequestCreate from '../VendorRequests/VendorRequestCreate';

import { showError } from '../../../utils/alert';

import { paymentApi } from '../../../services/paymentApi';

import './VendorBillsList.css';

export default function VendorBillsList({ vendorId, stallId }) {
  const { t, i18n } = useTranslation();

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filter states
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Pagination state
    const [pageNumber, setPageNumber] = useState(1);
    const [pageSize, setPageSize] = useState(5);
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
            showError(t('vendorbillslist.failure'), 'Đã xảy ra lỗi khi tạo yêu cầu thanh toán MoMo: ' + errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const handleVnpayPayment = async (invoiceId) => {
        try {
            setLoading(true);
            const { payUrl } = await paymentApi.createVnpayPayment(invoiceId);
            if (payUrl) {
                window.location.href = payUrl; // Chuyển hướng sang VNPay
            }
        } catch (err) {
            console.error(t('vendorbillslist.error_initiating_vnpay_payment'), err);
            const errorMsg = err.response?.data?.message || err.message;
            showError(t('vendorbillslist.failure'), 'Đã xảy ra lỗi khi tạo yêu cầu thanh toán VNPay: ' + errorMsg);
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

    const getInvoiceInfo = (inv) => {
        let name = (t('vendorbillslist.invoice_month') || 'Hóa đơn tháng') + ` ${inv.month}/${inv.year}`;
        let type = t('vendorbillslist.periodic') || 'Định kỳ';

        if (inv.details && inv.details.length > 0) {
            const hasPenalty = inv.details.some(d => d.feeTypeName?.toLowerCase().includes('phạt') || d.feeTypeName?.toLowerCase().includes('penalty'));
            if (hasPenalty) {
                name = t('vendorbillslist.penalty_invoice') || 'Hóa đơn tiền phạt';
                type = t('vendorbillslist.penalty') || 'Phạt vi phạm';
            } else if (inv.details.length === 1 && !['điện', 'nước', 'rác', 'bảo vệ', 'thuê', 'electric', 'water', 'waste', 'rent', 'security'].some(k => inv.details[0].feeTypeName?.toLowerCase().includes(k))) {
                name = inv.details[0].feeTypeName || (t('vendorbillslist.ad_hoc_invoice') || 'Hóa đơn phát sinh');
                type = t('vendorbillslist.ad_hoc') || 'Phát sinh';
            }
        }
        return { name, type };
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
        <div className="premium-page-container">
            <div className="premium-page-header">
                <div>
                    <h2 className="premium-page-title">{t('vendorbillslist.utility_bills') || 'Hóa đơn định kỳ'}</h2>
                    <span className="premium-page-subtitle">{t('vendorbillslist.view_a_list_of') || 'Quản lý và thanh toán các hóa đơn của sạp'}</span>
                </div>
            </div>

            <div className="premium-filter-bar" style={{ flexWrap: 'wrap' }}>
                <div className="premium-filter-group" style={{ maxWidth: '200px' }}>
                    <label className="premium-filter-label">{t('vendorbillslist.month') || 'Tháng'}</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)} className="premium-select">
                        <option value="">{t('vendorbillslist.all') || 'Tất cả'}</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                </div>
                <div className="premium-filter-group" style={{ maxWidth: '200px' }}>
                    <label className="premium-filter-label">{t('vendorbillslist.year') || 'Năm'}</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)} className="premium-select">
                        <option value="">{t('vendorbillslist.all') || 'Tất cả'}</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <button className="premium-btn premium-btn-primary" onClick={handleSearch} disabled={loading} style={{ height: '42px', padding: '0 24px' }}>
                    {loading ? (t('vendorbillslist.looking_for') || 'Đang tìm...') : (t('vendorbillslist.search') || 'Tìm kiếm')}
                </button>
            </div>

            <div className="premium-table-wrapper">
                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>{t('vendorbillslist.loading_data') || 'Đang tải...'}</div>
                ) : invoices.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '48px', height: '48px', marginBottom: '16px', opacity: 0.5 }}>
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <p style={{ margin: 0 }}>{t('vendorbillslist.there_are_no_invoices') || 'Không có hóa đơn nào'}</p>
                    </div>
                ) : (
                    <>
                        <table className="premium-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>{t('vendorbillslist.invoice_name') || 'Tên hóa đơn'}</th>
                                    <th>{t('vendorbillslist.invoice_type') || 'Loại hóa đơn'}</th>
                                    <th>{t('vendorbillslist.fall_semester_monthyear') || 'Kỳ (Tháng/Năm)'}</th>
                                    <th>{t('vendorbillslist.total_amount_vnd') || 'Tổng tiền'}</th>
                                    <th>{t('vendorbillslist.due_date') || 'Hạn chót'}</th>
                                    <th>{t('vendorbillslist.trng_thi_status') || 'Trạng thái'}</th>
                                    <th style={{ textAlign: 'center' }}>{t('vendorbillslist.operation') || 'Thao tác'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv, index) => {
                                    let badgeClass = 'premium-badge-neutral';
                                    let statusText = inv.status;
                                    
                                    if (inv.status?.toLowerCase() === 'paid') {
                                        badgeClass = 'premium-badge-success';
                                        statusText = t('vendorbillslist.paid') || 'Đã thanh toán';
                                    } else if (inv.status?.toLowerCase() === 'unpaid') {
                                        badgeClass = 'premium-badge-warning';
                                        statusText = t('vendorbillslist.not_yet_paid') || 'Chưa thanh toán';
                                    } else if (inv.status?.toLowerCase() === 'overdue') {
                                        badgeClass = 'premium-badge-danger';
                                        statusText = t('vendorbillslist.overdue') || 'Quá hạn';
                                    }

                                    const { name: invName, type: invType } = getInvoiceInfo(inv);

                                    return (
                                    <tr key={inv.invoiceId}>
                                        <td className="fw-bold">#{(pageNumber - 1) * pageSize + index + 1}</td>
                                        <td><span style={{ fontWeight: 600 }}>{invName}</span></td>
                                        <td><span className="premium-badge premium-badge-neutral">{invType}</span></td>
                                        <td>{inv.month}/{inv.year}</td>
                                        <td className="fw-bold" style={{ color: '#ef4444' }}>{formatCurrency(inv.totalAmount)}</td>
                                        <td>{inv.dueDate || '-'}</td>
                                        <td>
                                            <span className={`premium-badge ${badgeClass}`}>{statusText}</span>
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button 
                                                    className="premium-btn-action"
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    title={t('vendorbillslist.view_invoice_details')}
                                                >
                                                    {t('vendorbillslist.see_details') || 'Chi tiết'}
                                                </button>
                                                {inv.status?.toLowerCase() !== 'paid' && (
                                                <button 
                                                    className="premium-btn-primary" style={{ padding: '6px 12px', fontSize: '13px' }}
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    title={t('vendorbillslist.online_payment')}
                                                >
                                                    {t('vendorbillslist.pay') || 'Thanh toán'}
                                                </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {!loading && invoices.length > 0 && totalPages > 1 && (
                            <div className="premium-pagination">
                                <span className="premium-pagination-info">Trang {pageNumber} / {totalPages}</span>
                                <div className="premium-pagination-buttons">
                                    <button 
                                        className="premium-page-btn"
                                        disabled={pageNumber <= 1}
                                        onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                                    >
                                        {t('vendorbillslist.previous_page') || 'Trước'}
                                    </button>
                                    
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button 
                                            key={page} 
                                            className={`premium-page-btn ${pageNumber === page ? 'active' : ''}`}
                                            style={pageNumber === page ? { backgroundColor: '#1e40af', color: 'white', borderColor: '#1e40af' } : {}}
                                            onClick={() => setPageNumber(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    <button 
                                        className="premium-page-btn"
                                        disabled={pageNumber >= totalPages}
                                        onClick={() => setPageNumber(prev => Math.min(totalPages, prev + 1))}
                                    >
                                        {t('vendorbillslist.next_page') || 'Sau'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Chi tiết Hóa đơn */}
            {selectedInvoice && (
                <div className="bill-modal-overlay" onClick={() => setSelectedInvoice(null)}>
                    <div className="bill-modal-content" onClick={e => e.stopPropagation()}>
                        <div className="bill-modal-header">
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>{i18n.language === 'en' ? 'Invoice Details - Period' : 'Chi tiết hóa đơn - Kỳ'} {selectedInvoice.month}/{selectedInvoice.year}</h3>
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
                                        <td colSpan="3" style={{ padding: '16px', textAlign: 'right', fontWeight: 'bold', color: '#4b5563' }}>{i18n.language === 'en' ? 'TOTAL' : 'TỔNG CỘNG'}</td>
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
                                {i18n.language === 'en' ? 'Invoice Complaint' : 'Khiếu nại hóa đơn'}
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
                                    <button 
                                        className="btn-pay-vnpay" 
                                        style={{ backgroundColor: '#005baa', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handleVnpayPayment(selectedInvoice.invoiceId)}>
                                        {t('vendorbillslist.pay_via_vnpay')}
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
