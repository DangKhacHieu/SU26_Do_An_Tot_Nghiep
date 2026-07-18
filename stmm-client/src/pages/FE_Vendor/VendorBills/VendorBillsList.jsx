import React, { useState, useEffect } from 'react';
import { vendorInvoiceApi } from '../../../services/vendorInvoiceApi';
import { paymentApi } from '../../../services/paymentApi';
import './VendorBillsList.css';

export default function VendorBillsList({ vendorId, stallId }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter states
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Modal state
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

    useEffect(() => {
        fetchInvoices();
    }, [stallId]);

    const fetchInvoices = async () => {
        if (!vendorId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await vendorInvoiceApi.getVendorInvoices(
                stallId,
                month ? parseInt(month) : null,
                year ? parseInt(year) : null
            );
            setInvoices(data || []);
        } catch (err) {
            console.error('Lỗi khi tải hóa đơn:', err);
            setError('Đã xảy ra lỗi khi tải danh sách hóa đơn.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchInvoices();
    };

    const handlePayment = async (invoiceId, requestType) => {
        try {
            setLoading(true);
            const { payUrl } = await paymentApi.createMomoPayment(invoiceId, requestType);
            if (payUrl) {
                window.location.href = payUrl; // Chuyển hướng sang MoMo
            }
        } catch (err) {
            console.error('Lỗi khởi tạo thanh toán MoMo:', err);
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
                return <span className="bill-badge badge-success">Đã thanh toán</span>;
            case 'unpaid':
                return <span className="bill-badge badge-warning">Chưa thanh toán</span>;
            case 'overdue':
                return <span className="bill-badge badge-danger">Quá hạn</span>;
            default:
                return <span className="bill-badge badge-secondary">{status}</span>;
        }
    };

    return (
        <div className="vendor-bills-container fade-in">
            <div className="bills-header">
                <h2>Hóa đơn tiện ích</h2>
                <p>Xem danh sách hóa đơn tiện ích hàng tháng.</p>
            </div>

            <div className="bills-filters">
                <div className="filter-group">
                    <label>Tháng</label>
                    <select value={month} onChange={(e) => setMonth(e.target.value)}>
                        <option value="">Tất cả</option>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <label>Năm</label>
                    <select value={year} onChange={(e) => setYear(e.target.value)}>
                        <option value="">Tất cả</option>
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>
                <button className="btn-search" onClick={handleSearch} disabled={loading}>
                    {loading ? 'Đang tìm...' : 'Tìm kiếm'}
                </button>
            </div>

            {error && <div className="bills-error-msg">{error}</div>}

            <div className="bills-content">
                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : invoices.length === 0 ? (
                    <div className="empty-state">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="2" y1="10" x2="22" y2="10" />
                        </svg>
                        <p>Không có hóa đơn nào cho thời gian đã chọn.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="bills-table">
                            <thead>
                                <tr>
                                    <th>STT</th>
                                    <th>Kỳ thu (Month/Year)</th>
                                    <th>Tổng tiền (VNĐ)</th>
                                    <th>Hạn chót (Due Date)</th>
                                    <th>Trạng thái (Status)</th>
                                    <th style={{ textAlign: 'center' }}>Thao tác</th>
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
                                                title="Xem chi tiết hóa đơn"
                                            >
                                                Xem chi tiết
                                            </button>
                                            <button 
                                                className={`btn-pay ${inv.status?.toLowerCase() === 'paid' ? 'disabled' : ''}`}
                                                disabled={inv.status?.toLowerCase() === 'paid'}
                                                onClick={() => setSelectedInvoice(inv)}
                                                title={inv.status?.toLowerCase() === 'paid' ? 'Hóa đơn đã thanh toán' : 'Thanh toán trực tuyến'}
                                            >
                                                Thanh toán
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                <div><strong>Mã sạp:</strong> {selectedInvoice.stallCode}</div>
                                <div><strong>Hạn chót:</strong> {selectedInvoice.dueDate || '-'}</div>
                                <div><strong>Trạng thái:</strong> {getStatusBadge(selectedInvoice.status)}</div>
                            </div>
                            
                            <h4 style={{ marginTop: '20px', marginBottom: '12px', color: '#334155' }}>Các khoản thu</h4>
                            <table className="bills-details-table">
                                <thead>
                                    <tr>
                                        <th>Loại phí</th>
                                        <th>Mô tả</th>
                                        <th style={{ textAlign: 'right' }}>Chỉ số / Số lượng</th>
                                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
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
                            {selectedInvoice.status?.toLowerCase() !== 'paid' && (
                                <div className="payment-options" style={{ display: 'flex', gap: '10px' }}>
                                    <button 
                                        className="btn-pay-momo" 
                                        style={{ backgroundColor: '#a50064', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handlePayment(selectedInvoice.invoiceId, 'captureWallet')}>
                                        Quét mã QR MoMo
                                    </button>
                                    <button 
                                        className="btn-pay-atm" 
                                        style={{ backgroundColor: '#334155', color: 'white', padding: '8px 16px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                                        onClick={() => handlePayment(selectedInvoice.invoiceId, 'payWithATM')}>
                                        Thanh toán Thẻ ATM
                                    </button>
                                </div>
                            )}
                            <button className="btn-cancel" onClick={() => setSelectedInvoice(null)}>Đóng</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
