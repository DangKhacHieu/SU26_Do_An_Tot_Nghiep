import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showWarning } from '../../../utils/alert';

const VendorRequestCreate = ({ onBack, onSuccess, prefillViolationId, prefillStallId }) => {
    const [stalls, setStalls] = useState([]);
    const [loadingStalls, setLoadingStalls] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Form state
    const [stallId, setStallId] = useState(prefillStallId || '');
    const [requestType, setRequestType] = useState(prefillViolationId ? 'ViolationAppeal' : 'FacilityIssue');
    const [title, setTitle] = useState(prefillViolationId ? `Kháng nghị vi phạm #${prefillViolationId}` : '');
    const [description, setDescription] = useState('');
    const [violationId, setViolationId] = useState(prefillViolationId || '');
    const [invoiceId, setInvoiceId] = useState('');
    
    // Data state
    const [violations, setViolations] = useState([]);
    const [invoices, setInvoices] = useState([]);

    const getViolationStatusText = (status) => {
        switch (status) {
            case 'Pending': return 'Chờ duyệt';
            case 'Notified': return 'Chưa khiếu nại (Đã thông báo)';
            case 'Appealed': return 'Đang kháng nghị';
            case 'Approved': return 'Kháng nghị thành công';
            case 'Rejected': return 'Kháng nghị bị từ chối';
            case 'Finalized': return 'Đã chốt phạt';
            default: return status || 'Chưa khiếu nại';
        }
    };

    // Helper to translate invoice status
    const getInvoiceStatusText = (status) => {
        switch (status) {
            case 'Paid': return 'Đã thanh toán';
            case 'Overdue': return 'Quá hạn';
            case 'Pending':
            case 'Unpaid': return 'Chưa thanh toán';
            default: return status || 'Chưa thanh toán';
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch stalls
                const stallsRes = await axios.get('http://localhost:5056/api/vendor/services/my-stalls', config);
                setStalls(stallsRes.data || []);
                if (stallsRes.data && stallsRes.data.length > 0 && !prefillStallId) {
                    setStallId(stallsRes.data[0].stallId);
                }

                // Fetch violations
                const violationsRes = await axios.get('http://localhost:5056/api/vendor/violations?pageSize=100', config);
                if (violationsRes.data?.items) {
                    setViolations(violationsRes.data.items);
                    if (!prefillViolationId && violationsRes.data.items.length > 0) {
                        setViolationId(violationsRes.data.items[0].violationId);
                    }
                }

                // Fetch invoices
                const invoicesRes = await axios.get('http://localhost:5056/api/vendor/invoices', config);
                if (Array.isArray(invoicesRes.data)) {
                    setInvoices(invoicesRes.data);
                    if (invoicesRes.data.length > 0) {
                        setInvoiceId(invoicesRes.data[0].invoiceId);
                    }
                }

            } catch (err) {
                console.error('Lỗi khi tải dữ liệu khởi tạo:', err);
            } finally {
                setLoadingStalls(false);
            }
        };

        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stallId) {
            showWarning('Thiếu thông tin', 'Vui lòng chọn sạp.');
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('accessToken');
            const payload = {
                stallId: parseInt(stallId),
                requestType,
                title,
                description,
                violationId: violationId ? parseInt(violationId) : null,
                invoiceId: invoiceId ? parseInt(invoiceId) : null
            };

            await axios.post('http://localhost:5056/api/vendor/requests', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            await showSuccess('Thành công', 'Gửi yêu cầu thành công!');
            onSuccess();
        } catch (err) {
            console.error('Lỗi khi gửi yêu cầu:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.';
            showError('Thất bại', msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button 
                    onClick={onBack}
                    style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                </button>
                <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Tạo Yêu Cầu Hỗ Trợ</h2>
                    <span style={{ color: '#888', fontSize: '13px' }}>Điền thông tin bên dưới để gửi yêu cầu đến Ban Quản Lý</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Chọn Sạp</label>
                    {loadingStalls ? (
                        <div style={{ padding: '10px', background: '#f9fafb', borderRadius: '6px', color: '#888' }}>Đang tải danh sách sạp...</div>
                    ) : stalls.length === 0 ? (
                        <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b' }}>Bạn không có hợp đồng sạp hợp lệ nào để tạo yêu cầu.</div>
                    ) : (
                        <select 
                            value={stallId} 
                            onChange={(e) => setStallId(e.target.value)}
                            required
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                            {stalls.map(stall => (
                                <option key={stall.stallId} value={stall.stallId}>
                                    Sạp {stall.code} {stall.size ? `(${stall.size}m²)` : ''}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Loại Yêu Cầu</label>
                    <select 
                        value={requestType} 
                        onChange={(e) => setRequestType(e.target.value)}
                        required
                        disabled={!!prefillViolationId}
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: prefillViolationId ? '#f9fafb' : 'white', cursor: prefillViolationId ? 'not-allowed' : 'auto' }}>
                        
                        <option value="FacilityIssue">Sự cố hạ tầng chung (Facility Issue)</option>
                        <option value="ViolationAppeal">Kháng nghị vi phạm (Violation Appeal)</option>
                        <option value="InvoiceDispute">Khiếu nại hóa đơn (Invoice Dispute)</option>
                    </select>
                </div>

                {requestType === 'ViolationAppeal' && !prefillViolationId && (() => {
                    const eligibleViolations = violations.filter(v => !['Appealed', 'Approved', 'Rejected', 'Finalized'].includes(v.status));
                    return (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Chọn Biên Bản Vi Phạm</label>
                            {eligibleViolations.length === 0 ? (
                                <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>Bạn hiện không có biên bản vi phạm nào để khiếu nại.</div>
                            ) : (
                                <select 
                                    value={violationId} 
                                    onChange={(e) => setViolationId(e.target.value)} 
                                    required
                                    style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                                    <option value="" disabled>-- Hãy chọn biên bản cần khiếu nại --</option>
                                    {eligibleViolations.map(v => (
                                        <option key={v.violationId} value={v.violationId}>
                                            [{getViolationStatusText(v.status)}] Biên bản: {v.title} (Sạp {v.stallCode})
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    );
                })()}

                {requestType === 'ViolationAppeal' && prefillViolationId && (
                    <div style={{ display: 'none' }}>
                        <input type="hidden" value={violationId} />
                    </div>
                )}

                {requestType === 'InvoiceDispute' && (
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Chọn Hóa Đơn</label>
                        {invoices.length === 0 ? (
                            <div style={{ padding: '10px', background: '#fee2e2', borderRadius: '6px', color: '#991b1b', fontSize: '13px' }}>Bạn hiện không có hóa đơn nào để khiếu nại.</div>
                        ) : (
                            <select 
                                value={invoiceId} 
                                onChange={(e) => setInvoiceId(e.target.value)} 
                                required
                                style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }}>
                                <option value="" disabled>-- Hãy chọn hóa đơn cần khiếu nại --</option>
                                {invoices.map(inv => {
                                    const isDisabled = inv.status === 'Paid';
                                    return (
                                        <option key={inv.invoiceId} value={inv.invoiceId} disabled={isDisabled}>
                                            [{getInvoiceStatusText(inv.status)}] Hóa đơn Tháng {inv.month}/{inv.year} (Sạp {inv.stallCode}) - {inv.totalAmount?.toLocaleString()}đ
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Tiêu đề yêu cầu</label>
                    <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)} 
                        required
                        placeholder="VD: Bóng đèn khu A102 bị cháy..." 
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Mô tả chi tiết</label>
                    <textarea 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required
                        rows="5"
                        placeholder="Mô tả cụ thể vấn đề bạn đang gặp phải..." 
                        style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                    <button 
                        type="button" 
                        onClick={onBack}
                        disabled={isSubmitting}
                        style={{ background: 'transparent', border: '1px solid #ccc', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Hủy
                    </button>
                    <button 
                        type="submit" 
                        disabled={isSubmitting || stalls.length === 0}
                        style={{ background: isSubmitting || stalls.length === 0 ? '#9ca3af' : '#000', color: '#fff', border: 'none', padding: '12px 32px', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmitting || stalls.length === 0 ? 'not-allowed' : 'pointer' }}>
                        {isSubmitting ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default VendorRequestCreate;
