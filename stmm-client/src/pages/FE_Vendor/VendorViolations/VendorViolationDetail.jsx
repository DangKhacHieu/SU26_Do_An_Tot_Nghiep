import { useTranslation } from 'react-i18next';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { showError } from '../../../utils/alert';
import VendorRequestCreate from '../VendorRequests/VendorRequestCreate';

export default function VendorViolationDetail({ violationId, onBack, onSuccess }) {
  const { t, i18n } = useTranslation();

    const [violation, setViolation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAppealing, setIsAppealing] = useState(false);

    useEffect(() => {
        const fetchViolationDetail = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const response = await axios.get(`http://localhost:5056/api/vendor/violations/${violationId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setViolation(response.data);
            } catch (err) {
                console.error(t('vendorviolationdetail.error_when_loading_minutes'), err);
                showError(t('vendorviolationdetail.failure'), t('vendorviolationdetail.unable_to_download_details'));
                onBack();
            } finally {
                setLoading(false);
            }
        };

        if (violationId) {
            fetchViolationDetail();
        }
    }, [violationId, onBack]);

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Pending': return <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.waiting_for_approval')}</span>;
            case 'Notified': return <span style={{ background: '#dbeafe', color: '#1e40af', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.notified')}</span>;
            case 'Appealed': return <span style={{ background: '#fce7f3', color: '#9d174d', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.appealing')}</span>;
            case 'Approved': return <span style={{ background: '#d1fae5', color: '#065f46', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.appeal_successful')}</span>;
            case 'Rejected': return <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.the_appeal_failed')}</span>;
            case 'Finalized': return <span style={{ background: '#dcfce3', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{t('vendorviolationdetail.penalty_fixed')}</span>;
            default: return <span style={{ background: '#f3f4f6', color: '#374151', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '13px' }}>{status}</span>;
        }
    };

    if (isAppealing) {
        return <VendorRequestCreate 
            onBack={() => setIsAppealing(false)} 
            onSuccess={() => { setIsAppealing(false); onSuccess(); }} 
            prefillViolationId={violationId}
            prefillStallId={violation?.stallId}
        />;
    }

    if (loading || !violation) {
        return <div style={{ padding: '32px', textAlign: 'center', color: '#888' }}>{t('vendorviolationdetail.loading_details')}</div>;
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
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>{i18n.language === 'en' ? 'Violation Details #' : 'Chi Tiết Vi Phạm #'}{violation.violationId}</h2>
                        <span style={{ color: '#888', fontSize: '13px' }}>{t('vendorviolationdetail.created_at_time', { date: new Date(violation.createdAt).toLocaleDateString('vi-VN'), time: new Date(violation.createdAt).toLocaleTimeString('vi-VN') })}</span>
                    </div>
                </div>
                {getStatusBadge(violation.status)}
            </div>

            {/* Content */}
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorviolationdetail.violation_booth')}</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{violation.stallCode}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorviolationdetail.type_of_violation')}</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{violation.violationTypeName || 'N/A'}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorviolationdetail.record_keeping_staff')}</label>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{violation.createdByName}</div>
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '4px' }}>{t('vendorviolationdetail.amount_of_fine')}</label>
                        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#991b1b' }}>
                            {violation.fineAmount ? `${violation.fineAmount.toLocaleString('vi-VN')} VNĐ` : '0 VNĐ'}
                        </div>
                    </div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorviolationdetail.offending_title')}</label>
                    <div style={{ fontSize: '15px', fontWeight: '600', background: '#f9fafb', padding: '12px', borderRadius: '6px' }}>{violation.title}</div>
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorviolationdetail.detailed_description')}</label>
                    <div style={{ fontSize: '14px', lineHeight: '1.6', background: '#f9fafb', padding: '16px', borderRadius: '6px', whiteSpace: 'pre-wrap' }}>
                        {violation.description}
                    </div>
                </div>

                {violation.imageUrl && (
                    <div>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px' }}>{t('vendorviolationdetail.photo_evidence')}</label>
                        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb', display: 'inline-block' }}>
                            <img src={violation.imageUrl} alt={t('vendorviolationdetail.evidence_of_violation')} style={{ maxWidth: '100%', maxHeight: '400px', display: 'block' }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Actions */}
            {(violation.status === 'Pending' || violation.status === 'Notified') && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e5e7eb', paddingTop: '24px' }}>
                    <button 
                        onClick={() => setIsAppealing(true)}
                        style={{ background: '#000', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s' }}>
                        {t('vendorviolationdetail.protest_this_minutes')}
                    </button>
                </div>
            )}
        </div>
    );
};
