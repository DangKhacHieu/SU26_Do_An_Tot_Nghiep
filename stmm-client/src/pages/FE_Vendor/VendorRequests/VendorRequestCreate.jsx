import React, { useState, useEffect } from 'react';
import axios from 'axios';

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

    useEffect(() => {
        const fetchStalls = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get('http://localhost:5056/api/vendor/services/my-stalls', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStalls(response.data || []);
                if (response.data && response.data.length > 0) {
                    if (!prefillStallId) {
                        setStallId(response.data[0].stallId);
                    }
                }
            } catch (err) {
                console.error('Lỗi khi tải danh sách sạp:', err);
                alert('Không thể tải danh sách sạp.');
            } finally {
                setLoadingStalls(false);
            }
        };

        fetchStalls();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stallId) {
            alert('Vui lòng chọn sạp.');
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

            alert('Gửi yêu cầu thành công!');
            onSuccess();
        } catch (err) {
            console.error('Lỗi khi gửi yêu cầu:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi yêu cầu.';
            alert(msg);
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

                {requestType === 'ViolationAppeal' && (
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Mã Vi Phạm (Nếu có)</label>
                        <input 
                            type="number" 
                            value={violationId} 
                            onChange={(e) => setViolationId(e.target.value)} 
                            placeholder="Nhập mã ID biên bản vi phạm cần kháng nghị..." 
                            readOnly={!!prefillViolationId}
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none', background: prefillViolationId ? '#f9fafb' : 'white' }} />
                    </div>
                )}

                {requestType === 'InvoiceDispute' && (
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '8px' }}>Mã Hóa Đơn (Nếu có)</label>
                        <input 
                            type="number" 
                            value={invoiceId} 
                            onChange={(e) => setInvoiceId(e.target.value)} 
                            placeholder="Nhập mã ID hóa đơn cần khiếu nại..." 
                            style={{ width: '100%', padding: '12px', border: '1px solid #e5e7eb', borderRadius: '6px', outline: 'none' }} />
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
