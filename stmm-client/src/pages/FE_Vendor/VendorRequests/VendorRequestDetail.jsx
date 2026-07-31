import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../../../utils/alert';

export default function VendorRequestDetail({ requestId, onBack, onSuccess }) {
  const { t, i18n } = useTranslation();

    const [request, setRequest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isResolvingQuote, setIsResolvingQuote] = useState(false);
    const [declineMode, setDeclineMode] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        const fetchRequestDetail = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`http://localhost:5056/api/vendor/requests/${requestId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setRequest(response.data);
            } catch (err) {
                console.error(t('vendorrequestdetail.error_loading_request_details'), err);
                showError(t('vendorrequestdetail.failure'), t('vendorrequestdetail.unable_to_load_request'));
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
        const result = await showConfirm(t('vendorrequestdetail.confirm_cancellation'), 'Bạn có chắc chắn muốn hủy yêu cầu này không? Hành động này không thể hoàn tác.');
        if (!result.isConfirmed) {
            return;
        }

        setIsCancelling(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`http://localhost:5056/api/vendor/requests/${requestId}/cancel`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess(t('vendorrequestdetail.success'), t('vendorrequestdetail.request_canceled_successfully'));
            onSuccess();
        } catch (err) {
            console.error(t('vendorrequestdetail.error_when_canceling_request'), err);
            const msg = err.response?.data?.message || 'Có lỗi xảy ra khi hủy yêu cầu.';
            showError(t('vendorrequestdetail.failure'), msg);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleResolveQuote = async (approve) => {
        if (!approve) {
            if (!rejectReason || rejectReason.length < 10 || rejectReason.length > 1000) {
                showError(t('vendorrequestdetail.failure'), t('vendorrequestdetail.decline_reason_required') || 'Vui lòng nhập lý do từ chối (10-1000 ký tự).');
                return;
            }
        }

        const confirmMsg = approve 
            ? 'Bạn có chắc chắn muốn DUYỆT báo giá này và ĐỒNG Ý chi trả chi phí sửa chữa không?' 
            : 'Bạn có chắc chắn muốn TỪ CHỐI báo giá và HỦY yêu cầu sửa chữa này không?';
        const result = await showConfirm(t('vendorrequestdetail.confirm'), confirmMsg);
        if (!result.isConfirmed) {
            return;
        }

        setIsResolvingQuote(true);
        try {
            const token = localStorage.getItem('accessToken');
            await axios.post(`http://localhost:5056/api/vendor/requests/${requestId}/resolve-quote`, 
            { approve, rejectReason: approve ? null : rejectReason }, 
            {
                headers: { Authorization: `Bearer ${token}` }
            });
            await showSuccess(t('vendorrequestdetail.success'), approve ? t('vendorrequestdetail.quote_approved_successfully') : t('vendorrequestdetail.quote_successfully_declined'));
            setDeclineMode(false);
            onSuccess();
        } catch (err) {
            console.error(t('vendorrequestdetail.error_when_processing_quote'), err);
            const msg = err.response?.data?.message || t('vendorrequestdetail.an_error_occurred_while');
            showError(t('vendorrequestdetail.failure'), msg);
        } finally {
            setIsResolvingQuote(false);
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
        return <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorrequestdetail.loading_details')}</div>;
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
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{i18n.language === 'en' ? 'Request Details #' : 'Chi Tiết Yêu Cầu #'}{request.requestId}</h2>
                        <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorrequestdetail.created_at_time', { date: new Date(request.createdAt).toLocaleDateString('vi-VN'), time: new Date(request.createdAt).toLocaleTimeString('vi-VN') })}</span>
                    </div>
                </div>
                {getStatusBadge(request.status)}
            </div>

            {/* Thông tin yêu cầu */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>{t('vendorrequestdetail.requested_information')}</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.stall')}</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.stallCode}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.request_type')}</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{request.requestType}</div>
                    </div>
                    {request.violationId && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.id_violation_appeal')}</label>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>#{request.violationId}</div>
                        </div>
                    )}
                    {request.invoiceId && (
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.claim_id_bill')}</label>
                            <div style={{ fontSize: '14px', fontWeight: '500' }}>#{request.invoiceId}</div>
                        </div>
                    )}
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorrequestdetail.title')}</label>
                    <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '16px', background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>{request.title}</div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorrequestdetail.detailed_description')}</label>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', background: '#f9fafb', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                        {request.description}
                    </div>
                </div>
            </div>

            {/* Phản hồi từ BQL */}
            {request.status !== 'Pending' && (request.status !== 'Cancelled' || request.quotationAmount != null) && (
                <div style={{ border: '1px solid #c7d2fe', borderRadius: '8px', padding: '24px', marginBottom: '24px', background: '#eef2ff' }}>
                    <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold', color: '#3730a3', borderBottom: '1px solid #c7d2fe', paddingBottom: '12px' }}>{t('vendorrequestdetail.response_from_management')}</h3>
                    
                    {request.quotationText ? (
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorrequestdetail.quote_content_feedback')}</label>
                            <div style={{ fontSize: '14px', lineHeight: '1.6', background: 'white', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', border: '1px solid #e0e7ff' }}>
                                {request.quotationText}
                            </div>
                        </div>
                    ) : (
                        <div style={{ fontSize: '14px', color: '#6366f1', fontStyle: 'italic', marginBottom: '20px' }}>{t('vendorrequestdetail.the_management_board_is')}</div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                        {request.quotationAmount != null && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.total_expected_cost')}</label>
                                <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#312e81' }}>
                                    {request.quotationAmount.toLocaleString('vi-VN')} VNĐ
                                </div>
                            </div>
                        )}
                        {request.paidBy && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.paying_party')}</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: '#312e81' }}>
                                    {request.paidBy === 'Vendor' ? t('vendorrequestdetail.small_business') : request.paidBy === 'Market' ? t('vendorrequestdetail.market_management_board') : request.paidBy}
                                </div>
                            </div>
                        )}
                        {request.isQuoteApproved != null && (
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorrequestdetail.price_approval_status')}</label>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: request.isQuoteApproved ? '#166534' : '#991b1b' }}>
                                    {request.isQuoteApproved ? t('vendorrequestdetail.approved') : t('vendorrequestdetail.refuse')}
                                </div>
                            </div>
                        )}
                        {request.vendorRejectReason && (
                            <div style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                                <label style={{ display: 'block', fontSize: '12px', color: '#991b1b', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>Lý do từ chối của bạn</label>
                                <div style={{ fontSize: '14px', lineHeight: '1.6', background: '#fef2f2', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap', border: '1px solid #fecaca', color: '#7f1d1d' }}>
                                    {request.vendorRejectReason}
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
                        {isCancelling ? t('vendorrequestdetail.canceling') : t('vendorrequestdetail.cancel_this_request')}
                    </button>
                </div>
            )}

            {/* Vendor Quotation Approval Actions */}
            {request.status === 'Quoted' && request.paidBy === 'Vendor' && request.isQuoteApproved == null && (
                <div style={{ marginTop: '24px', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    {declineMode ? (
                        <div style={{ background: '#fef2f2', padding: '16px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                            <label style={{ display: 'block', fontSize: '13px', color: '#991b1b', fontWeight: 'bold', marginBottom: '8px' }}>
                                {t('vendorrequestdetail.reason_for_refusal') || 'Lý do từ chối (Bắt buộc, 10-1000 ký tự)'}
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows="3"
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #fca5a5', marginBottom: '12px', boxSizing: 'border-box' }}
                                placeholder={t('vendorrequestdetail.enter_reason_placeholder') || 'Nhập lý do chi tiết...'}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                                <button
                                    onClick={() => setDeclineMode(false)}
                                    disabled={isResolvingQuote}
                                    style={{
                                        background: '#f3f4f6', color: '#374151', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer'
                                    }}
                                >
                                    {t('vendorrequestdetail.cancel')}
                                </button>
                                <button
                                    onClick={() => handleResolveQuote(false)}
                                    disabled={isResolvingQuote}
                                    style={{
                                        background: '#ef4444', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: isResolvingQuote ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {t('vendorrequestdetail.confirm_refusal') || 'Xác nhận từ chối'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => handleResolveQuote(true)}
                                disabled={isResolvingQuote}
                                style={{
                                    background: '#10b981', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: isResolvingQuote ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {t('vendorrequestdetail.approve_quote_agree_to')}
                            </button>
                            <button
                                onClick={() => setDeclineMode(true)}
                                disabled={isResolvingQuote}
                                style={{
                                    background: '#ef4444', color: '#ffffff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: isResolvingQuote ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {t('vendorrequestdetail.refuse_to_quote')}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
