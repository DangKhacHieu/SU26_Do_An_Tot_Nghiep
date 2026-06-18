import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VendorRequestDetail = ({ requestId, onBack, onSuccess }) => {
    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);

    useEffect(() => {
        const fetchRequestDetail = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`http://localhost:5056/api/vendor/requests/${requestId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRequest(response.data);
            } catch (err) {
                console.error('Lỗi khi tải chi tiết yêu cầu:', err);
                alert('Không thể tải chi tiết yêu cầu.');
                onBack();
            } finally {
                setLoading(false);
            }
        };

        if (requestId) {
            fetchRequestDetail();
        }
    }, [requestId, onBack]);

    const handleCancelRequest = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.')) {
            return;
        }

        setIsCancelling(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`http://localhost:5056/api/vendor/requests/${requestId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            alert('Đã hủy yêu cầu thành công.');
            onSuccess();
        } catch (err) {
            console.error('Lỗi khi hủy yêu cầu:', err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu.';
            alert(msg);
        } finally {
            setIsCancelling(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Pending': return <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
            case 'Quoted': return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
            case 'Approved': return <span style={{ background: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
            case 'Completed': return <span style={{ background: '#dcfce3', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
            case 'Cancelled': 
            case 'Rejected': return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
            default: return <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
        }
    };

    if (loading || !request) {
        return <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Đang tải chi tiết...</div>;
    }

    return (
        <div style={{ background: 'white', minHeight: '100%', padding: '32px', borderRadius: '12px', maxWidth: '800px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button 
                        onClick={onBack}
                        style={{ background: 'transparent', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                    </button>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>Chi Tiết Yêu Cầu #{request.requestId}</h2>
                        <span style={{ color: '#888', fontSize: '13px' }}>Tạo ngày {new Date(request.createdAt).toLocaleDateString('vi-VN')} lúc {new Date(request.createdAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                </div>
                {getStatusBadge(request.status)}
            </div>

            {/* Thông tin yêu cầu */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>Thông Tin Yêu Cầu</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Sạp</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.stallCode}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Loại Yêu Cầu</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.requestType}</div>
                    </div>
                    {request.violationId && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Kháng nghị Vi Phạm ID</label>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>#{request.violationId}</div>
                        </div>
                    )}
                    {request.invoiceId && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Khiếu nại Hóa Đơn ID</label>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>#{request.invoiceId}</div>
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Tiêu đề</label>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>{request.title}</div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Mô tả chi tiết</label>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', background: '#f9fafb', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                        {request.description}
                    </div>
                </div>
            </div>

            {/* Phản hồi từ BQL */}
            {request.status !== 'Pending' && request.status !== 'Cancelled' && (
                <div style={{ border: '1px solid #c7d2fe', borderRadius: '8px', padding: '24px', marginBottom: '24px', background: '#eef2ff' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', color: '#3730a3', borderBottom: '1px solid #c7d2fe', paddingBottom: '12px' }}>Phản Hồi Từ Ban Quản Lý</h3>
                    
                    {request.quotationText ? (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>Nội dung báo giá / Phản hồi</label>
                            <div style={{ fontSize: '14px', lineHeight: '1.6', background: 'white', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', border: '1px solid #e0e7ff' }}>
                                {request.quotationText}
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '14px', color: '#6366f1', fontStyle: 'italic', marginBottom: '20px' }}>Ban quản lý đang xử lý và chưa có phản hồi văn bản.</div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        {request.quotationAmount != null && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Tổng chi phí dự kiến</label>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#312e81' }}>
                                    {request.quotationAmount.toLocaleString('vi-VN')} VNĐ
                                </div>
                            </div>
                        )}
                        {request.paidBy && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Bên chi trả</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#312e81' }}>
                                    {request.paidBy === 'Vendor' ? 'Tiểu thương' : request.paidBy === 'Market' ? 'Ban quản lý chợ' : request.paidBy}
                                </div>
                            </div>
                        )}
                        {request.isQuoteApproved != null && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Tình trạng duyệt giá</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: request.isQuoteApproved ? '#166534' : '#991b1b' }}>
                                    {request.isQuoteApproved ? 'Đã duyệt' : 'Từ chối'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            {request.status === 'Pending' && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <button 
                        onClick={handleCancelRequest}
                        disabled={isCancelling}
                        style={{ background: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: isCancelling ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>
                        {isCancelling ? 'Đang hủy...' : 'Hủy Yêu Cầu Này'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default VendorRequestDetail;
